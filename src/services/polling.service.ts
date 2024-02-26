import { TransactionResponse, TransactionStatus } from "fireblocks-sdk";
import { Clients } from "../interfaces/Clients";
import { patchTransactionAmountUsd } from "../util/cmc/patchTransactionAmountUsd";
import {
  handleTransactionCreated,
  handleTransactionStatusUpdated,
} from "./webhook.service";
import { Transaction } from "../model/transaction";
import { MoreThan } from "typeorm";
import { ITransactionDetails, TransactionSubStatus } from "../interfaces/transaction";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const groupBy = <T, K extends keyof never>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);

// TODO: 1. implement fullSync?
// TODO: 2. implement pagination when calling getTransactions?
export class PollingService {
  private active: boolean;
  private pollingIntervalMs: number;
  private readonly completedStatuses: TransactionStatus[] = [
    TransactionStatus.COMPLETED,
    TransactionStatus.CANCELLED,
    TransactionStatus.REJECTED,
    TransactionStatus.FAILED,
    TransactionStatus.BLOCKED
  ];
    
  constructor(private readonly clients: Clients) {
    this.active = false;
    this.pollingIntervalMs = 60000;
  }

  private async getDbRecentTransactionsSorted(minLastUpdated: Date): Promise<Pick<Transaction, "id" | "createdAt" | "lastUpdated" | "status">[]> {
    return await Transaction.find({
      select: ["id", "createdAt", "lastUpdated", "status"],
      where: {
        lastUpdated: MoreThan(minLastUpdated),
      },
      order: { "createdAt": "ASC" },
    });
  }

  private hoursAgoDate(hours: number) {
    const date: Date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
  }

  private isCompletedTx(tx: {status: TransactionStatus}) { return this.completedStatuses.includes(tx.status); }

  private txResponseToTxDetails(tr: TransactionResponse): ITransactionDetails {
    return {
      ...tr,
      subStatus: TransactionSubStatus[tr.subStatus as keyof typeof TransactionSubStatus],
      destinations: tr.destinations?.map(dest => ({
        ...dest,
        amountUSD: Number(dest.amountUSD),
        // TODO: should we fill 'destinationAddress' although:
        // 1. dest.destination.address is not publicly available in Fireblocks API
        // 2. dest.destination.address only has value when the destination is a blockchain address
      })),
      signedMessages: tr.signedMessages!,
    };
  }

  async pollAndUpdate() { 
    try {
      // Get recent transactions from DB (ignore transactions that were not updated for more than 48 hours):
      const dbRecentTxs = await this.getDbRecentTransactionsSorted(this.hoursAgoDate(48));
      // Get createdAt of earliest non-completed tx
      const firstNonCompletedTx = dbRecentTxs.find(tx => !this.isCompletedTx(tx));
      const minCreatedAt: Date = firstNonCompletedTx?.createdAt || this.hoursAgoDate(48);
      // Get transactions from Fireblocks:
      const txsResponses: TransactionResponse[] = await this.clients.admin.getTransactions({
        after: minCreatedAt.getTime() - 1
      });
      
      const dbRecentTxsById = groupBy(dbRecentTxs, tx => tx.id);
      for (const txResponse of txsResponses) {
        const tx = this.txResponseToTxDetails(txResponse);
        const { id, status } = tx;
        await patchTransactionAmountUsd(tx, this.clients.cmc);
        if (!dbRecentTxsById[tx.id]) {
          // Tx doesn't exist in DB yet
          await handleTransactionCreated(id, status, tx);
        }
        else if (new Date(tx.lastUpdated) > dbRecentTxsById[tx.id][0].lastUpdated) {
          // Tx exists in DB and it was updated in Fireblocks
          await handleTransactionStatusUpdated(id, status, tx);
        }
        else {
          // Tx exists in DB and it was not updated.
          console.debug(`tx ${tx.id}: no change`);
        }
      }
    }
    catch (error) {
      console.error(error);
    }
  }

  async start() {
    console.log("Polling for tx: start");
    this.active = true;
    while (this.active) {
      await this.pollAndUpdate();
      await sleep(this.pollingIntervalMs);
    }

    console.log("Polling for tx: finished");
  }

  stop() {
    console.log("Polling for tx: 'stop' received");
    this.active = false;
  }
}
