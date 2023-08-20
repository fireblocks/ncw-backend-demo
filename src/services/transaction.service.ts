import {
  FireblocksSDK,
  TransactionArguments,
  TransactionStatus,
} from "fireblocks-sdk";
import { In, MoreThan, And, FindOptionsOrderValue, LessThan } from "typeorm";
import { Transaction } from "../model/transaction";

export class TransactionService {
  constructor(private readonly signer: FireblocksSDK) {}

  async findOne(txId: string, walletId: string) {
    return await Transaction.findOne({
      where: {
        id: txId,
        wallets: { id: walletId },
      },
    });
  }

  async find(
    walletId: string,
    orderBy: "lastUpdated" | "createdAt",
    startDate: Date,
    endDate: Date,
    statuses: TransactionStatus[] | undefined,
    dir: FindOptionsOrderValue,
    skip: number,
    take: number,
  ) {
    return await Transaction.find({
      where: {
        wallets: {
          id: walletId,
        },
        [orderBy]: And(MoreThan(startDate), LessThan(endDate)),
        status: statuses ? In(statuses) : undefined,
      },
      order: { [orderBy]: dir as FindOptionsOrderValue },
      skip,
      take,
    });
  }

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
