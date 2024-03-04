import {
  PeerType,
  TransactionPageFilter,
  TransactionResponse,
  TransactionStatus,
} from "fireblocks-sdk";
import { Clients } from "../interfaces/Clients";
import { patchTransactionAmountUsd } from "../util/cmc/patchTransactionAmountUsd";
import { Transaction } from "../model/transaction";
import { FindOptionsWhere, MoreThan } from "typeorm";
import {
  ITransactionDetails,
  TransactionSubStatus,
} from "../interfaces/transaction";
import { fetchAll } from "../util/fetch-all";
import * as TransactionDbHelper from "./transactionDbHelper.service";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const groupBy = <T, K extends keyof never>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      (groups[key(item)] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );

class PollingService {
  private active: boolean;
  private readonly pollingIntervalMs: number = 60_000;
  private readonly pollingShortIntervalMs: number = 10_000;
  private currentPollingIntervalMs: number;
  private incomingTxTimer: NodeJS.Timeout | null;
  private static readonly FINAL_STATUSES: TransactionStatus[] = [
    TransactionStatus.COMPLETED,
    TransactionStatus.CANCELLED,
    TransactionStatus.REJECTED,
    TransactionStatus.FAILED,
    TransactionStatus.BLOCKED,
  ];
  private static instance: PollingService;
  private constructor(private readonly clients: Clients) {
    this.active = false;
    this.currentPollingIntervalMs = this.pollingIntervalMs;
  }

  public static getInstance(): PollingService {
    return PollingService.instance;
  }

  public static createInstance(clients: Clients): PollingService {
    PollingService.instance?.stop();
    PollingService.instance = new PollingService(clients);
    return PollingService.instance;
  }

  public async start() {
    console.log("PollingService: start");
    this.active = true;

    // perform full sync first
    await this.pollAndUpdate(true);
    await sleep(this.currentPollingIntervalMs);

    console.log("PollingService: finished full sync, starting polling loop");

    while (this.active) {
      await this.pollAndUpdate();
      await sleep(this.currentPollingIntervalMs);
    }
  }

  public stop() {
    console.log("PollingService: 'stop' received");
    this.active = false;
    if (this.incomingTxTimer) {
      clearTimeout(this.incomingTxTimer);
      this.incomingTxTimer = null;
    }
  }

  private async getDbTxs(
    minLastUpdated?: Date,
  ): Promise<
    Pick<Transaction, "id" | "createdAt" | "lastUpdated" | "status">[]
  > {
    const where: FindOptionsWhere<Transaction> = minLastUpdated
      ? { lastUpdated: MoreThan(minLastUpdated) }
      : {};

    return await Transaction.find({
      select: ["id", "createdAt", "lastUpdated", "status"],
      where,
      order: { createdAt: "ASC" },
    });
  }

  private hoursAgoDate(hours: number) {
    const date: Date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
  }

  private isCompletedTx(tx: { status: TransactionStatus }) {
    return PollingService.FINAL_STATUSES.includes(tx.status);
  }

  private txResponseToTxDetails(tx: TransactionResponse): ITransactionDetails {
    return {
      ...tx,
      subStatus:
        TransactionSubStatus[tx.subStatus as keyof typeof TransactionSubStatus],
      destinations: tx.destinations?.map((dest) => ({
        ...dest,
        amountUSD: Number(dest.amountUSD),
      })),
      signedMessages: tx.signedMessages!,
    };
  }

  private async fetchNcwTransactions(txPageFilter: TransactionPageFilter) {
    const fetchTransactions = (txPageFilter: TransactionPageFilter) =>
      fetchAll(async ({ pageCursor }) => {
        const resp = await this.clients.signer.getTransactionsWithPageInfo(
          txPageFilter,
          pageCursor,
        );
        return {
          data: resp.transactions,
          nextCursor: resp.pageDetails.nextPage,
        };
      });

    const [txs1, txs2] = await Promise.all([
      fetchTransactions({
        ...txPageFilter,
        sourceType: PeerType.END_USER_WALLET,
      }),
      fetchTransactions({
        ...txPageFilter,
        destType: PeerType.END_USER_WALLET,
      }),
    ]);

    if (txPageFilter.sort === "ASC") {
      return [...txs1, ...txs2].sort((a, b) => a.createdAt - b.createdAt);
    } else if (txPageFilter.sort === "DESC") {
      return [...txs1, ...txs2].sort((a, b) => b.createdAt - a.createdAt);
    } else {
      return [...txs1, ...txs2];
    }
  }

  /**
   * Increases the current polling frequency for a short period of time
   */
  private increasePollingFrequency() {
    console.log(
      "PollingService: increasePollingFrequency - increase frequency",
    );
    this.currentPollingIntervalMs = this.pollingShortIntervalMs;

    if (this.incomingTxTimer) {
      clearTimeout(this.incomingTxTimer);
      this.incomingTxTimer = null;
    }

    this.incomingTxTimer = setTimeout(() => {
      console.log(
        "PollingService: increasePollingFrequency - reset back to normal",
      );
      this.currentPollingIntervalMs = this.pollingIntervalMs;
    }, 120_000);
  }

  private async upsertTx(
    txResponse: TransactionResponse,
    dbTxsById: Record<
      string,
      Pick<Transaction, "id" | "createdAt" | "lastUpdated" | "status">[]
    >,
  ) {
    try {
      const tx = this.txResponseToTxDetails(txResponse);
      const { id, status } = tx;
      await patchTransactionAmountUsd(tx, this.clients.cmc);

      if (!dbTxsById[tx.id]) {
        // Tx doesn't exist in DB yet
        await TransactionDbHelper.create(id, status, tx);
        this.increasePollingFrequency();
      } else if (new Date(tx.lastUpdated) > dbTxsById[tx.id][0].lastUpdated) {
        // Tx exists in DB and it was updated in Fireblocks
        await TransactionDbHelper.update(id, status, tx);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Polls transactions from Fireblocks and updates the DB
   * @param all - if true, will poll all transactions, otherwise will poll only recent transactions
   */
  private async pollAndUpdate(all: boolean = false) {
    try {
      // Get transactions from DB (ignore transactions that were not updated for more than 48 hours):
      const dbTxs = await this.getDbTxs(
        all ? undefined : this.hoursAgoDate(48),
      );

      let txPageFilter: TransactionPageFilter = {};
      if (!all) {
        // Get createdAt of earliest non-completed tx
        const firstNonCompletedTx = dbTxs.find((tx) => !this.isCompletedTx(tx));

        const minCreatedAt =
          firstNonCompletedTx?.createdAt || this.hoursAgoDate(48);
        txPageFilter = { after: minCreatedAt.getTime() - 1 };
      }

      // Get transactions from Fireblocks:
      const txsResponses: TransactionResponse[] =
        await this.fetchNcwTransactions(txPageFilter);

      const dbTxsById = groupBy(dbTxs, (tx) => tx.id);
      for (const txResponse of txsResponses) {
        await this.upsertTx(txResponse, dbTxsById);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export { PollingService };
