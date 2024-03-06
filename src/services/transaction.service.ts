import { FireblocksSDK, TransactionArguments } from "fireblocks-sdk";
import { eventEmitter } from "../util/eventEmitter";

class TransactionService {
  constructor(private readonly signer: FireblocksSDK) {}

  async estimate(walletId: string, args: TransactionArguments) {
    const { low, medium, high } = await this.signer.estimateFeeForTransaction(
      args,
      { ncw: { walletId } },
    );
    return { low, medium, high };
  }

  async create(walletId: string, args: TransactionArguments) {
    const { id, status } = await this.signer.createTransaction(args, {
      ncw: { walletId },
    });

    eventEmitter.emit("tx_created", id);

    return { id, status };
  }

  async cancel(walletId: string, txId: string) {
    const { success } = await this.signer.cancelTransactionById(txId, {
      ncw: { walletId },
    });

    eventEmitter.emit("tx_cancelled", txId);

    return { success };
  }
}

export { TransactionService };
