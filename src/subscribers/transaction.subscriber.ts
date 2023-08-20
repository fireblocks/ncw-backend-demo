import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  IsNull,
  UpdateEvent,
} from "typeorm";
import EventEmitter from "events";
import { Transaction } from "../model/transaction";
import { TransactionStatus } from "fireblocks-sdk";

const emitter = new EventEmitter();

@EventSubscriber()
export class TransactionSubscriber implements EntitySubscriberInterface {
  listenTo() {
    return Transaction;
  }

  private getWalletKey(walletId: string) {
    return `wallet:${walletId}`;
  }

  private getWalletStatusKey(walletId: string, status: string) {
    return `wallet:${walletId}:${status}`;
  }

  afterInsert(event: InsertEvent<Transaction>) {
    // note: when running this server in multiple instances this event should be distributed to all nodes
    for (const wallet of event.entity.wallets) {
      emitter.emit(this.getWalletKey(wallet.id), event.entity);
      emitter.emit(
        this.getWalletStatusKey(wallet.id, event.entity.status),
        event.entity,
      );
    }
  }

  afterUpdate(event: UpdateEvent<Transaction>) {
    // note: when running this server in multiple instances this event should be distributed to all nodes
    for (const wallet of event.entity?.wallets) {
      emitter.emit(this.getWalletKey(wallet.id), event.entity);
      emitter.emit(
        this.getWalletStatusKey(wallet.id, event.entity?.status),
        event.entity,
      );
    }
  }

  async waitForTransactions(
    walletId: string,
    timeout: number,
    statuses?: TransactionStatus[],
  ): Promise<Transaction[]> {
    const controller = new AbortController();

    const promise = statuses
      ? Promise.race(
          statuses.map((status) =>
            EventEmitter.once(
              emitter,
              this.getWalletStatusKey(walletId, status),
              { signal: controller.signal },
            ),
          ),
        )
      : EventEmitter.once(emitter, this.getWalletKey(walletId), {
          signal: controller.signal,
        });

    const timer = setTimeout(controller.abort.bind(controller), timeout);
    try {
      const result = await promise;
      clearTimeout(timer);
      // abort others
      if (statuses) {
        controller.abort();
      }
      const txs: Transaction[] = result.filter((s) => !!s);
      return txs;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return [];
      }
      throw error;
    }
  }
}
