import { TransactionResponse, TransactionStatus } from "fireblocks-sdk";
import { Clients } from "../interfaces/Clients";
import { patchTransactionAmountUsd } from "../util/cmc/patchTransactionAmountUsd";
import {
  handleTransactionCreated,
  handleTransactionCreatedOrUpdated,
  handleTransactionStatusUpdated,
} from "./webhook.service";
import { Transaction } from "../model/transaction";
import { MoreThan } from "typeorm";
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

export class PollingService {
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

  constructor(private readonly clients: Clients) {
    this.active = false;
    this.currentPollingIntervalMs = this.pollingIntervalMs;
  }

  private async getDbRecentTransactionsSorted(
    minLastUpdated: Date,
  ): Promise<
    Pick<Transaction, "id" | "createdAt" | "lastUpdated" | "status">[]
  > {
    return await Transaction.find({
      select: ["id", "createdAt", "lastUpdated", "status"],
      where: {
        lastUpdated: MoreThan(minLastUpdated),
      },
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

  private async pollAndUpdateAll() {
    console.log("PollingService: pollAndUpdateAll");
    try {
      // Get transactions from Fireblocks:
      const txsResponses: TransactionResponse[] = await fetchAllTxs(
        (pagePath) =>
          this.clients.admin.getTransactionsWithPageInfo({}, pagePath),
      );
      for (const txResponse of txsResponses) {
        const tx = this.txResponseToTxDetails(txResponse);
        const { id, status } = tx;
        await patchTransactionAmountUsd(tx, this.clients.cmc);
        await handleTransactionCreatedOrUpdated(id, status, tx);
      }
    } catch (error) {
      console.error(error);
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

  /**
   * Polls for recent transactions from FB BE and updates their status in DB.
   */
  async pollAndUpdate() {
    try {
      // Get recent transactions from DB (ignore transactions that were not updated for more than 48 hours):
      const dbRecentTxs = await this.getDbRecentTransactionsSorted(
        this.hoursAgoDate(48),
      );
      // Get createdAt of earliest non-completed tx
      const firstNonCompletedTx = dbRecentTxs.find(
        (tx) => !this.isCompletedTx(tx),
      );
      const minCreatedAt: Date =
        firstNonCompletedTx?.createdAt || this.hoursAgoDate(48);
      // Get transactions from Fireblocks:
      const txsResponses: TransactionResponse[] = await fetchAllTxs(
        (pagePath) =>
          this.clients.admin.getTransactionsWithPageInfo(
            { after: minCreatedAt.getTime() - 1 },
            pagePath,
          ),
      );

      const dbRecentTxsById = groupBy(dbRecentTxs, (tx) => tx.id);
      for (const txResponse of txsResponses) {
        const tx = this.txResponseToTxDetails(txResponse);
        const { id, status } = tx;
        await patchTransactionAmountUsd(tx, this.clients.cmc);

        try {
          if (!dbRecentTxsById[tx.id]) {
            // Tx doesn't exist in DB yet
            await handleTransactionCreated(id, status, tx);
            this.increasePollingFrequency();
          } else if (
            new Date(tx.lastUpdated) > dbRecentTxsById[tx.id][0].lastUpdated
          ) {
            // Tx exists in DB and it was updated in Fireblocks
            await handleTransactionStatusUpdated(id, status, tx);
          } else {
            // Tx exists in DB and it was not updated.
            console.debug(`tx ${tx.id}: no change`);
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
    await this.pollAndUpdateAll();
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
