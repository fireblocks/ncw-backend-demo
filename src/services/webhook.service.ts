import { Device } from "../model/device";
import { TransactionStatus } from "fireblocks-sdk";
import { ITransactionDetails } from "../interfaces/transaction";
import { Message } from "../model/message";
import * as TransactionDbHelper from "./transactionDbHelper.service";

export async function handleTransactionStatusUpdated(
  id: string,
  status: TransactionStatus,
  data: ITransactionDetails,
) {
  await TransactionDbHelper.update(id, status, data);
}

export async function handleTransactionCreated(
  id: string,
  status: TransactionStatus,
  data: ITransactionDetails,
) {
  await TransactionDbHelper.create(id, status, data);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleWalletEventMessage(event: string, payload: any) {
  console.log(
    `Received wallet event: ${event} with payload: ${JSON.stringify(payload)}`,
  );
}
