import { Device } from "../model/device";
import { PeerType, TransactionStatus } from "fireblocks-sdk";
import { In } from "typeorm";
import { ITransactionDetails } from "../interfaces/transaction";
import { Message } from "../model/message";
import { Wallet } from "../model/wallet";
import { Transaction } from "../model/transaction";

const StatusesToAddDestinationWallets: TransactionStatus[] = [
  TransactionStatus.CONFIRMING,
  TransactionStatus.COMPLETED,
];

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
  if (StatusesToAddDestinationWallets.includes(data.status)) {
    await patchAffectedWallets(tx, data, "destination");
  }
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

  await patchAffectedWallets(tx, data, "source");

  await tx.save();
}

export async function handleNcwDeviceMessage(
  deviceId: string,
  walletId: string,
  physicalDeviceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
) {
  const device = await Device.findOne({
    where: {
      id: deviceId,
      walletId,
    },
  });

  if (!device) {
    console.warn("ignoring NCW Device message for unknown deviceId", deviceId);
    return;
  }

  const msg = new Message();
  msg.device = device;
  msg.physicalDeviceId = physicalDeviceId;
  msg.message = JSON.stringify(data);
  await msg.save();
}

async function patchAffectedWallets(
  tx: Transaction,
  data: ITransactionDetails,
  direction: "source" | "destination",
) {
  const peerDetails =
    direction === "source"
      ? [data.source]
      : [
          data.destination,
          ...[...(data.destinations ? data.destinations : [])].map(
            (d) => d.destination,
          ),
        ];

  const wallets = new Set(
    peerDetails
      .filter((p) => p.type === PeerType.END_USER_WALLET)
      .map((p) => p.walletId!),
  );
  const affectedWallets = wallets.size
    ? await Wallet.find({
        where: { id: In([...wallets.values()]) },
      })
    : [];

  if (affectedWallets.length) {
    if (tx.wallets?.length) {
      const walletsToAdd = affectedWallets.filter(
        (affected) =>
          !tx.wallets.some((oldWallet) => affected.id === oldWallet.id),
      );
      tx.wallets.push(...walletsToAdd);
    } else {
      tx.wallets = affectedWallets;
    }
  } else {
    tx.wallets = tx.wallets ?? [];
  }
}
