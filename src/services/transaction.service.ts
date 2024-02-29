import { FireblocksSDK, TransactionArguments } from "fireblocks-sdk";

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
    return { id, status };
  }

  async cancel(walletId: string, txId: string) {
    const { success } = await this.signer.cancelTransactionById(txId, {
      ncw: { walletId },
    });
    return { success };
  }
}

export { TransactionService };
