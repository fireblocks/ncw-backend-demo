import { PeerType, TransactionStatus } from "fireblocks-sdk";
import { Transaction } from "../model/transaction";
import { And, FindOptionsOrderValue, In, LessThan, MoreThan } from "typeorm";
import { ITransactionDetails } from "../interfaces/transaction";
import { Wallet } from "../model/wallet";

async function createOrUpdate(
  id: string,
  status: TransactionStatus,
  data: ITransactionDetails,
) {
  let success = await create(id, status, data);
  if (!success) {
    success = await update(id, status, data);
  }

  return success;
}

async function findOne(txId: string, walletId: string) {
  return await Transaction.findOne({
    where: {
      id: txId,
      wallets: { id: walletId },
    },
  });
}

async function find(
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

async function update(
  id: string,
  status: TransactionStatus,
  data: ITransactionDetails,
) {
  const tx = await Transaction.findOneOrFail({
    where: { id },
    relations: { wallets: true },
  });

  // Ensure consistency
  if (tx.lastUpdated >= new Date(data.lastUpdated)) {
    console.warn(`Transaction id ${id}: already updated. Skipping update`);
    return false;
  }

  tx.status = status;
  tx.details = data;
  tx.lastUpdated = new Date(data.lastUpdated);
  await tx.save();
  return true;
}

async function create(
  id: string,
  status: TransactionStatus,
  data: ITransactionDetails,
) {
  const tx = new Transaction();
  tx.id = id;
  tx.status = status;
  tx.createdAt = new Date(data.createdAt);
  tx.lastUpdated = new Date(data.lastUpdated);
  tx.details = data;

  const wallets = new Set(
    [
      data.source,
      data.destination,
      ...[...(data.destinations ? data.destinations : [])].map(
        (d) => d.destination,
      ),
    ]
      .filter((p) => p?.type === PeerType.END_USER_WALLET)
      .map((p) => p?.walletId),
  );

  if (wallets.size) {
    tx.wallets = await Wallet.find({
      where: { id: In([...wallets.values()]) },
    });
  } else {
    tx.wallets = [];
  }

  // Ensure consistency
  const existingTx = await Transaction.findOne({ where: { id } });
  if (existingTx) {
    console.warn(`Transaction id ${id}: already exists. Skipping create`);
    return false;
  }

  await tx.save();
  return true;
}

export { findOne, find, update, create, createOrUpdate };
