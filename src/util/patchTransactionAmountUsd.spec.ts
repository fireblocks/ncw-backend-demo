import { anything, instance, mock, when } from "ts-mockito";
import { patchTransactionAmountUsd } from "./patchTransactionAmountUsd";
import { CryptoClient } from "coinmarketcap-js";
import {
  PeerType,
  TransactionStatus,
  TransactionOperation,
} from "fireblocks-sdk";
import {
  ITransactionDetails,
  TransactionSubStatus,
} from "../interfaces/transaction";
import { mockQuoteResponse } from "../test/mockQuoteResponse";

function createTx(
  txId: string,
  walletId: string,
): Partial<ITransactionDetails> {
  return {
    id: txId,
    createdAt: new Date().valueOf(),
    lastUpdated: new Date().valueOf(),
    assetId: "ETH_TEST",
    source: {
      id: "0",
      type: PeerType.END_USER_WALLET,
      walletId,
      name: "External",
      subType: "",
    },
    destination: {
      id: "0",
      type: PeerType.VAULT_ACCOUNT,
      name: "Default",
      subType: "",
    },
    amount: 0.00001,
    networkFee: 0.00000141,
    netAmount: 0.00001,
    sourceAddress: "tb1q5c3y5g4mm2ge6zvavtvwzuc7nl9jt5knvk36sk",
    destinationAddress: "tb1qrscwnskfaejtthnh4ds8h4wu6fcxhhgfjj2xay",
    destinationAddressDescription: "",
    destinationTag: "",
    status: TransactionStatus.SUBMITTED,
    txHash: "0ca2e172b36359687981786114034e4c89379b23cd5137b1b6b0f9ee41d90669",
    subStatus: TransactionSubStatus.PENDING_BLOCKCHAIN_CONFIRMATIONS,
    signedBy: [],
    createdBy: "",
    rejectedBy: "",
    amountUSD: 0,
    addressType: "",
    note: "",
    exchangeTxId: "",
    requestedAmount: 0.00001,
    feeCurrency: "ETH_TEST",
    operation: TransactionOperation.TRANSFER,
    customerRefId: "123",
    numOfConfirmations: 0,
    amountInfo: {
      amount: "0.00001",
      requestedAmount: "0.00001",
      netAmount: "0.00001",
      amountUSD: undefined,
    },
    feeInfo: { networkFee: "0.00000141" },
    destinations: [],
    blockInfo: { blockHash: undefined },
    signedMessages: [],
    index: 1,
  };
}

describe("patchTransactionAmountUsd", () => {
  it("patchTransactionAmountUsd", async () => {
    const cmc = mock<CryptoClient>();
    const price = 2.5;

    when(cmc.latestQuotes(anything())).thenResolve(
      mockQuoteResponse(price, "ETH"),
    );
    const tx = createTx("123", "333");
    expect(tx.amountUSD).toBe(0);
    await patchTransactionAmountUsd(tx as ITransactionDetails, instance(cmc));
    expect(tx.amountUSD).not.toBe(0);
    expect(tx.amountUSD).toBe(price * tx.amount!);
  });
});
