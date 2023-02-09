import { createConnection, getConnection } from "typeorm";
import { Device } from "../model/device";
import { Message } from "../model/message";
import { User } from "../model/user";
import { Wallet } from "../model/wallet";
import { Transaction } from "../model/transaction";
import { TransactionSubscriber } from "./transaction.subscriber";
import {
  ITransactionDetails,
  TransactionSubStatus,
} from "../interfaces/transaction";
import {
  PeerType,
  TransactionOperation,
  TransactionStatus,
} from "fireblocks-sdk";

describe("transaction subscriber", () => {
  const walletId = "33";
  const deviceId = "123";

  beforeEach(async () => {
    const conn = await createConnection({
      type: "better-sqlite3",
      database: ":memory:",
      dropSchema: true,
      subscribers: [TransactionSubscriber],
      entities: [Wallet, Device, Message, User, Transaction],
      synchronize: true,
      logging: false,
    });
    await conn.synchronize();

    const user = new User();
    user.sub = "sub";
    await user.save();

    const wallet = new Wallet();
    wallet.id = walletId;
    await wallet.save();

    const device = new Device();
    device.id = deviceId;
    device.userId = user.id;
    device.walletId = wallet.id;
    await device.save();
  });

  afterEach(async () => {
    const conn = getConnection();
    return conn.close();
  });

  it("should resolve wait for txs on message insert", async () => {
    const sub = new TransactionSubscriber();
    const prom = sub.waitForTransactions(walletId, 20_000);

    const txId = "122";
    const payload: Partial<ITransactionDetails> = createTx(txId, walletId);

    const tx = new Transaction();
    tx.id = txId;
    tx.status = payload.status!;
    tx.details = payload as ITransactionDetails;
    tx.createdAt = new Date();
    tx.lastUpdated = new Date();
    const wallet = await Wallet.findOneOrFail({ where: { id: walletId } });
    tx.wallets = [wallet];
    await tx.save();

    const recv = await prom;
    expect(recv[0]).toMatchObject(tx);
  });

  it("should resolve wait for txs on message update", async () => {
    const sub = new TransactionSubscriber();
    const prom = sub.waitForTransactions(walletId, 20_000, [
      TransactionStatus.COMPLETED,
    ]);

    const txId = "122";
    const payload: Partial<ITransactionDetails> = createTx(txId, walletId);

    const tx = new Transaction();
    tx.id = txId;
    tx.status = payload.status!;
    tx.details = payload as ITransactionDetails;
    tx.createdAt = new Date();
    tx.lastUpdated = new Date();
    const wallet = await Wallet.findOneOrFail({ where: { id: walletId } });
    tx.wallets = [wallet];
    await tx.save();

    tx.lastUpdated = new Date();
    tx.status = TransactionStatus.COMPLETED;
    await tx.save();

    const recv = await prom;
    expect(recv[0]).toMatchObject(tx);
  });

  it("should resolve wait for txs on insert with status", async () => {
    const sub = new TransactionSubscriber();
    const prom = sub.waitForTransactions(walletId, 20_000, [
      TransactionStatus.SUBMITTED,
      TransactionStatus.BLOCKED,
    ]);

    const txId = "123";
    const payload: Partial<ITransactionDetails> = createTx(txId, walletId);

    const tx = new Transaction();
    tx.id = txId;
    tx.status = payload.status!;
    tx.details = payload as ITransactionDetails;
    tx.createdAt = new Date();
    tx.lastUpdated = new Date();
    const wallet = await Wallet.findOneOrFail({ where: { id: walletId } });
    tx.wallets = [wallet];
    await tx.save();

    const recv = await prom;
    expect(recv[0]).toMatchObject(tx);
  });
});

function createTx(
  txId: string,
  walletId: string,
): Partial<ITransactionDetails> {
  return {
    id: txId,
    createdAt: new Date().valueOf(),
    lastUpdated: new Date().valueOf(),
    assetId: "BTC_TEST",
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
    feeCurrency: "BTC_TEST",
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
