import {
  TransactionPageFilter,
  TransactionResponse,
  TransactionStatus,
} from "fireblocks-sdk";
import { Clients } from "../interfaces/Clients";
import { patchTransactionAmountUsd } from "../util/cmc/patchTransactionAmountUsd";
import {
  handleTransactionCreated,
  handleTransactionStatusUpdated,
} from "./webhook.service";
import { Transaction } from "../model/transaction";
import { FindOptionsWhere, MoreThan } from "typeorm";
import {
  ITransactionDetails,
  TransactionSubStatus,
} from "../interfaces/transaction";
import { fetchAllTxs } from "../util/fetch-all";

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

  static readonly FINAL_STATUSES: TransactionStatus[] = [
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

  private txResponseToTxDetails(tr: TransactionResponse): ITransactionDetails {
    return {
      ...tr,
      subStatus:
        TransactionSubStatus[tr.subStatus as keyof typeof TransactionSubStatus],
      destinations: tr.destinations?.map((dest) => ({
        ...dest,
        amountUSD: Number(dest.amountUSD),
      })),
      signedMessages: tr.signedMessages!,
    };
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

  /**
   * Polls transactions from Fireblocks and updates the DB
   * @param all - if true, will poll all transactions, otherwise will poll only recent transactions
   */
  async pollAndUpdate(all: boolean = false) {
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
      const txsResponses: TransactionResponse[] = await fetchAllTxs(
        (pagePath) =>
          this.clients.admin.getTransactionsWithPageInfo(
            txPageFilter,
            pagePath,
          ),
      );

      const dbTxsById = groupBy(dbTxs, (tx) => tx.id);
      for (const txResponse of txsResponses) {
        const tx = this.txResponseToTxDetails(txResponse);
        const { id, status } = tx;
        await patchTransactionAmountUsd(tx, this.clients.cmc);

        try {
          if (!dbTxsById[tx.id]) {
            // Tx doesn't exist in DB yet
            await handleTransactionCreated(id, status, tx);
            this.increasePollingFrequency();
          } else if (
            new Date(tx.lastUpdated) > dbTxsById[tx.id][0].lastUpdated
          ) {
            // Tx exists in DB and it was updated in Fireblocks
            await handleTransactionStatusUpdated(id, status, tx);
          }
        } catch (error) {
          console.error(error);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async start() {
    console.log("PollingService: start");
    this.active = true;

    // perform full sync first
    await this.pollAndUpdate(true);
    await sleep(this.currentPollingIntervalMs);

    while (this.active) {
      await this.pollAndUpdate();
      await sleep(this.currentPollingIntervalMs);
    }
  }

  stop() {
    console.log("PollingService: 'stop' received");
    this.active = false;
    if (this.incomingTxTimer) {
      clearTimeout(this.incomingTxTimer);
      this.incomingTxTimer = null;
    }
  }
}

export { PollingService };
