import { PeerType, TransactionStatus } from "fireblocks-sdk";
import { In } from "typeorm";
import { ITransactionDetails } from "../interfaces/transaction";
import { Wallet } from "../model/wallet";
import { Transaction } from "../model/transaction";

export async function handleTransactionStatusUpdated(
  id: string,
  status: TransactionStatus,
  data: ITransactionDetails,
) {
  const tx = await Transaction.findOneOrFail({
    where: { id },
    relations: { wallets: true },
  });
  tx.status = status;
  tx.details = data;
  tx.lastUpdated = new Date(data.lastUpdated);
  await tx.save();
}

export async function handleTransactionCreated(
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
      .filter((p) => p.type === PeerType.END_USER_WALLET)
      .map((p) => p.walletId!),
  );

  if (wallets.size) {
    tx.wallets = await Wallet.find({
      where: { id: In([...wallets.values()]) },
    });
  } else {
    tx.wallets = [];
  }

  await tx.save();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleWalletEventMessage(event: string, payload: any) {
  console.log(
    `Received wallet event: ${event} with payload: ${JSON.stringify(payload)}`,
  );
}
