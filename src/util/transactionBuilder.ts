import {
  FeeLevel,
  PeerType,
  TransactionArguments,
  TransactionOperation,
} from "fireblocks-sdk";
import { buildTypedData } from "./typedData";

export function buildOnetimeAddressTransferArgs(
  destAddress: string,
  amount: string,
  feeLevel: FeeLevel,
  gasLimit?: string,
): TransactionArguments {
  return {
    operation: TransactionOperation.TRANSFER,
    destination: {
      type: PeerType.ONE_TIME_ADDRESS,
      oneTimeAddress: { address: destAddress },
    },
    amount,
    feeLevel,
    gasLimit,
  };
}
export function buildAccountTransferArgs(
  walletId: string,
  accountId: string,
  amount: string,
  feeLevel: FeeLevel,
  gasLimit?: string,
): TransactionArguments {
  return {
    operation: TransactionOperation.TRANSFER,
    destination: {
      type: PeerType.END_USER_WALLET,
      id: accountId,
      walletId,
    },
    amount,
    feeLevel,
    gasLimit,
  };
}
export function buildTestTypedDataArgs(): TransactionArguments {
  return {
    operation: TransactionOperation.TYPED_MESSAGE,
    extraParameters: {
      rawMessageData: {
        messages: [
          {
            type: "EIP712",
            content: buildTypedData(),
          },
        ],
      },
    },
  };
}
