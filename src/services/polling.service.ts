import {
  PeerType,
  TransactionPageFilter,
  TransactionResponse,
  TransactionStatus,
} from "fireblocks-sdk";
import { Clients } from "../interfaces/Clients";
import { patchTransactionAmountUsd } from "../util/cmc/patchTransactionAmountUsd";
import { Transaction } from "../model/transaction";
import { FindOptionsWhere, In, MoreThan } from "typeorm";
import {
  ITransactionDetails,
  TransactionSubStatus,
} from "../interfaces/transaction";
import { fetchAll } from "../util/fetch-all";
import * as TransactionDbHelper from "./transactionDbHelper.service";
import { eventEmitter } from "../util/eventEmitter";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const groupBy = <T, K extends keyof never>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      (groups[key(item)] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );

const TX_FINAL_STATUSES: TransactionStatus[] = [
  TransactionStatus.COMPLETED,
  TransactionStatus.CANCELLED,
  TransactionStatus.REJECTED,
  TransactionStatus.FAILED,
  TransactionStatus.BLOCKED,
];
const isTxFinal = (tx: { status: TransactionStatus }) =>
  TX_FINAL_STATUSES.includes(tx.status);

enum PollingMode {
  ALL,
  RECENT,
  BY_IDS,
}

/**
 * Represents a poller for active transactions.
 */
class ActiveTxPoller {
  private activeTxIds: Set<string> = new Set();
  private active: boolean = false;
  private txEventCallback: (txId: string) => void = (txId) => {
    console.debug(`ActiveTxPoller: tx event received for ${txId}`);
    this.addActiveTx(txId);
  };

  constructor(
    private readonly pollAndUpdateFn: (
      mode: PollingMode,
      txIds?: string[],
    ) => Promise<void>,
    private readonly pollingIntervalMs: number = 10_000,
  ) {}

  public initTxListener() {
    console.debug("ActiveTxPoller: initTxListener");
    this.removeTxListener();
    eventEmitter
      .on("tx_created", this.txEventCallback)
      .on("tx_cancelled", this.txEventCallback);
  }

  public removeTxListener() {
    console.debug("ActiveTxPoller: removeTxListener");
    eventEmitter
      .removeListener("tx_created", this.txEventCallback)
      .removeListener("tx_cancelled", this.txEventCallback);
  }

  public handleActiveTx(tx: Pick<ITransactionDetails, "id" | "status">) {
    if (isTxFinal(tx)) {
      this.removeActiveTx(tx.id);
    } else {
      this.addActiveTx(tx.id);
    }
  }

  private async startPolling() {
    if (!this.active) {
      console.debug(
        `ActiveTxPoller: polling loop started with interval: ${
          this.pollingIntervalMs / 1000
        } seconds`,
      );
      this.active = true;
      while (this.activeTxIds.size > 0) {
        await this.pollAndUpdateFn(
          PollingMode.BY_IDS,
          Array.from(this.activeTxIds),
        );
        await sleep(this.pollingIntervalMs);
      }
      this.active = false;
      console.debug("ActiveTxPoller: polling loop finished");
    }
  }

  private addActiveTx(txId: string) {
    console.debug(`ActiveTxPoller: addActiveTx ${txId}`);
    this.activeTxIds.add(txId);
    this.setRemoveTimer(txId);
    this.startPolling();
  }

  private removeActiveTx(txId: string) {
    console.debug(`ActiveTxPoller: removeActiveTx ${txId}`);
    this.activeTxIds.delete(txId);
  }

  private setRemoveTimer(txId: string) {
    setTimeout(() => this.removeActiveTx(txId), 120000);
  }
}

class PollingService {
  private static instance: PollingService;

  private activeTxPoller: ActiveTxPoller;
  private active: boolean;

  private constructor(
    private readonly clients: Clients,
    private readonly pollingIntervalMs: number = 60_000,
  ) {
    this.active = false;
    this.activeTxPoller = new ActiveTxPoller(this.pollAndUpdate.bind(this));
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
    console.debug("PollingService: start");
    this.active = true;
    this.activeTxPoller.initTxListener();

    // perform full sync first
    console.debug("PollingService: starting full sync");
    await this.pollAndUpdate(PollingMode.ALL);
    console.debug(
      `PollingService: finished full sync, sleeping for ${this.pollingIntervalMs} ms..`,
    );
    await sleep(this.pollingIntervalMs);

    console.debug(
      `PollingService: starting polling loop with interval: ${
        this.pollingIntervalMs / 1000
      } seconds`,
    );
    while (this.active) {
      await this.pollAndUpdate(PollingMode.RECENT);
      await sleep(this.pollingIntervalMs);
    }
  }

  public stop() {
    console.debug("PollingService: 'stop' received");
    this.active = false;
    this.activeTxPoller.removeTxListener();
  }

  private async getDbTxs(
    txIds?: string[],
    minLastUpdated?: Date,
  ): Promise<
    Pick<Transaction, "id" | "createdAt" | "lastUpdated" | "status">[]
  > {
    let where: FindOptionsWhere<Transaction> = {};
    if (minLastUpdated) where = { lastUpdated: MoreThan(minLastUpdated) };
    if (txIds) where = { ...where, id: In(txIds) };

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

  private async fetchTransactionsByIds(txIds: string[]) {
    const responses: TransactionResponse[] = [];
    for (const txId of txIds) {
      responses.push(await this.clients.signer.getTransactionById(txId));
    }

    return responses;
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

      let success: boolean = false;
      if (!dbTxsById[id]) {
        // possibly new TX
        success = await TransactionDbHelper.createOrUpdate(id, status, tx);
      } else if (new Date(tx.lastUpdated) > dbTxsById[id][0].lastUpdated) {
        // updated TX
        success = await TransactionDbHelper.update(id, status, tx);
      }

      if (success) this.activeTxPoller.handleActiveTx(tx);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Polls and updates transactions based on the specified mode.
   *
   * @param mode - The polling mode.
   * @param txIds - Optional array of transaction IDs to filter the polling results (relevant to PollingMode.BY_IDS only)
   */
  private async pollAndUpdate(mode: PollingMode, txIds?: string[]) {
    try {
      // Get transactions from DB
      const minLastUpdated =
        mode === PollingMode.RECENT ? this.hoursAgoDate(48) : undefined;
      const dbTxs = await this.getDbTxs(txIds, minLastUpdated);

      let txPageFilter: TransactionPageFilter = {};
      if (mode === PollingMode.RECENT) {
        // Get createdAt of earliest non-completed tx
        const firstNonCompletedTx = dbTxs.find((tx) => !isTxFinal(tx));
        const minCreatedAt =
          firstNonCompletedTx?.createdAt || this.hoursAgoDate(48);
        txPageFilter = { after: minCreatedAt.getTime() - 1 };
      }

      // Get transactions from Fireblocks:
      const txsResponses: TransactionResponse[] =
        mode === PollingMode.BY_IDS
          ? await this.fetchTransactionsByIds(txIds!)
          : await this.fetchNcwTransactions(txPageFilter);

      const dbTxsById = groupBy(dbTxs, (tx) => tx.id);
      for (const txResponse of txsResponses) {
        await this.upsertTx(txResponse, dbTxsById);
      }
    } catch (error) {
      console.error("PollingService.pollAndUpdate: ", error);
    }
  }
}

export { PollingService, ActiveTxPoller, PollingMode };
