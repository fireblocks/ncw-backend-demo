import request from "supertest";
import express from "express";
import crypto, { randomUUID } from "crypto";
import util from "util";

import { createApp } from "../app";
import { createConnection, getConnection } from "typeorm";

import { Device } from "../model/device";
import { Message } from "../model/message";
import { User } from "../model/user";
import { Wallet } from "../model/wallet";
import { FireblocksSDK, NCW, TransactionStatus } from "fireblocks-sdk";
import { anything, instance, mock, when } from "ts-mockito";
import { AuthOptions } from "express-oauth2-jwt-bearer";
import { sign, Algorithm } from "jsonwebtoken";
import { MessageSubscriber } from "../subscribers/message.subscriber";
import { Transaction } from "../model/transaction";
import { TransactionSubscriber } from "../subscribers/transaction.subscriber";
import { CryptoClient } from "coinmarketcap-js";
import { mockQuoteResponse } from "./mockQuoteResponse";
import { assetInfoMock } from "./assetInfo.mock";
import { NcwSdk } from "fireblocks-sdk/dist/src/ncw-sdk";

const generateKeyPair = util.promisify(crypto.generateKeyPair);

const sub = "user@test.com";
const walletId = "123";
const deviceId = "010";

const algorithm: Algorithm = "HS256";
const opts: AuthOptions = {
  issuer: "test-issuer",
  audience: "test-audience",
  secret: "test-secret",
  tokenSigningAlg: algorithm,
};

function signJwt(payload: object) {
  return sign(payload, opts.secret!, {
    algorithm,
    issuer: opts.issuer,
    audience: opts.audience,
    expiresIn: "1h",
  });
}

describe("e2e", () => {
  const fireblocksSdk = mock<FireblocksSDK>();
  const ncw = mock<NcwSdk>();

  when(fireblocksSdk.NCW).thenReturn(instance(ncw));

  const cmc = mock<CryptoClient>();
  const accessToken = signJwt({ sub });

  when(cmc.latestQuotes(anything())).thenResolve(
    mockQuoteResponse(1, ...Object.keys(assetInfoMock)),
  );

  let publicKey: string, privateKey: string;

  beforeAll(async () => {
    const pair = await generateKeyPair("rsa", {
      modulusLength: 1024,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    publicKey = pair.publicKey;
    privateKey = pair.privateKey;
  });

  beforeEach(async () => {
    app = createApp(
      opts,
      {
        admin: instance(fireblocksSdk),
        signer: instance(fireblocksSdk),
        cmc: instance(cmc),
      },
      publicKey,
    );

    const conn = await createConnection({
      type: "better-sqlite3",
      database: ":memory:",
      dropSchema: true,
      subscribers: [MessageSubscriber, TransactionSubscriber],
      entities: [Wallet, Device, Message, User, Transaction],
      synchronize: true,
      logging: false,
    });
    await conn.synchronize();
  });

  afterEach(async () => {
    const conn = getConnection();
    return conn.close();
  });

  let app: express.Express;

  async function createUser() {
    await request(app)
      .post("/api/login")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function createWallet() {
    when(ncw.createWallet()).thenResolve({ walletId, enabled: true });
    when(ncw.createWalletAccount(walletId)).thenResolve({
      walletId,
      accountId: 0,
    });

    await request(app)
      .post(`/api/devices/${deviceId}/assign`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200, { walletId });
  }

  async function getDevices() {
    return await request(app)
      .get(`/api/devices/`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function getAssets() {
    return await request(app)
      .get(`/api/devices/${deviceId}/accounts/${0}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function getAssetAddress(asset: string) {
    return await request(app)
      .get(`/api/devices/${deviceId}/accounts/${0}/assets/${asset}/address`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function invokeRpc() {
    const payload = JSON.stringify({ foo: "bar" });

    when(ncw.invokeWalletRpc(walletId, deviceId, payload)).thenResolve({
      result: "ok",
    });

    await request(app)
      .post(`/api/devices/${deviceId}/rpc`)
      .send({ message: payload })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200, { result: "ok" });
  }

  async function getTransactions(status?: TransactionStatus[], poll?: boolean) {
    const params = new URLSearchParams();
    if (status) {
      status.forEach((s) => params.append("status", s));
    }

    if (poll !== undefined) {
      params.append("poll", String(poll));
    }

    return await request(app)
      .get(`/api/devices/${deviceId}/transactions?${params}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function getTransaction(txId: string) {
    return await request(app)
      .get(`/api/devices/${deviceId}/transactions/${txId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function getMessages(timeout?: number) {
    const params = new URLSearchParams();
    if (timeout !== undefined) {
      params.append("timeout", String(timeout));
    }

    return await request(app)
      .get(`/api/devices/${deviceId}/messages?${params}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function deleteMessage(messageId: string) {
    return await request(app)
      .delete(`/api/devices/${deviceId}/messages/${messageId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  }

  async function webhookPush(payload: any) {
    const signer = crypto.createSign("RSA-SHA512");
    signer.update(JSON.stringify(payload));
    const signature = signer.sign(privateKey, "base64");

    return await request(app)
      .post(`/api/webhook`)
      .send(payload)
      .set("fireblocks-signature", signature)
      .expect(200);
  }

  async function webhookMessage(message = "foo") {
    const payload = {
      type: "NCW_DEVICE_MESSAGE",
      timestamp: Date().valueOf(),
      walletId,
      deviceId,
      data: {
        message,
      },
    };
    await webhookPush(payload);
  }

  async function webhookTransaction(
    txId = randomUUID(),
    type = "TRANSACTION_CREATED",
    status = TransactionStatus.CONFIRMING,
  ) {
    const payload = {
      type,
      timestamp: new Date().valueOf(),
      data: {
        id: txId,
        createdAt: new Date().valueOf(),
        lastUpdated: new Date().valueOf(),
        assetId: "BTC_TEST",
        source: {
          id: "0",
          type: "END_USER_WALLET",
          walletId,
          name: "External",
          subType: "",
        },
        destination: {
          id: "0",
          type: "VAULT_ACCOUNT",
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
        status: status,
        txHash:
          "0ca2e172b36359687981786114034e4c89379b23cd5137b1b6b0f9ee41d90669",
        subStatus: "PENDING_BLOCKCHAIN_CONFIRMATIONS",
        signedBy: [],
        createdBy: "",
        rejectedBy: "",
        amountUSD: 0,
        addressType: "",
        note: "",
        exchangeTxId: "",
        requestedAmount: 0.00001,
        feeCurrency: "BTC_TEST",
        operation: "TRANSFER",
        customerRefId: null,
        numOfConfirmations: 0,
        amountInfo: {
          amount: "0.00001",
          requestedAmount: "0.00001",
          netAmount: "0.00001",
          amountUSD: null,
        },
        feeInfo: { networkFee: "0.00000141" },
        destinations: [],
        externalTxId: null,
        blockInfo: { blockHash: null },
        signedMessages: [],
        index: 1,
        assetType: "BASE_ASSET",
      },
    };
    await webhookPush(payload);
  }

  it("should not allow unauthorized", async () => {
    await request(app).post("/api/login").expect(401);
  });

  it("should create user", async () => {
    await createUser();

    const user = await User.findOneBy({ sub });
    expect(user?.hasId).toBeTruthy();
  });

  it("should create wallet", async () => {
    await createUser();
    await createWallet();

    const wallet = await Wallet.findOneBy({ id: walletId });
    expect(wallet?.hasId).toBeTruthy();
  });

  it("should invoke rpc", async () => {
    await createUser();
    await createWallet();
    await invokeRpc();
  });

  it("should get devices", async () => {
    await createUser();
    {
      const { body } = await getDevices();
      expect(body).toMatchObject({
        devices: [],
      });
    }
    await createWallet();
    {
      const { body } = await getDevices();
      expect(body).toMatchObject({
        devices: [
          {
            deviceId,
            walletId,
          },
        ],
      });
    }
  });

  it("should handle empty msgs", async () => {
    await createUser();
    await createWallet();
    const { body } = await getMessages(1);
    expect(body).toHaveLength(0);
  });

  it("should handle msgs", async () => {
    await createUser();
    await createWallet();
    await webhookMessage();

    const { body } = await getMessages();
    expect(body).toHaveLength(1);

    const { body: body2 } = await getMessages(1);
    expect(body2).toHaveLength(0);

    const msg = body[0];
    expect(msg.id).toBeDefined();
    expect(msg.message).toBeDefined();

    await deleteMessage(msg.id);
    expect((await getMessages(1)).body).toHaveLength(0);
  });

  it("should return incoming messages immediately", async () => {
    await createUser();
    await createWallet();

    const msgProm = getMessages(20);
    await webhookMessage();
    await msgProm;
  });

  it("should handle transactions", async () => {
    const txId = "txId123";
    const txId2 = "txId1234";

    await createUser();
    await createWallet();

    expect((await getTransactions()).body).toEqual([]);
    await webhookTransaction(
      txId,
      "TRANSACTION_CREATED",
      TransactionStatus.CONFIRMING,
    );
    expect((await getTransactions()).body).toMatchObject([{ id: txId }]);
    await webhookTransaction(
      txId,
      "TRANSACTION_STATUS_UPDATED",
      TransactionStatus.PENDING_SIGNATURE,
    );
    expect(
      (await getTransactions([TransactionStatus.CONFIRMING])).body,
    ).toEqual([]);
    expect((await getTransaction(txId)).body).toMatchObject({
      id: txId,
      status: TransactionStatus.PENDING_SIGNATURE,
    });

    await webhookTransaction(
      txId2,
      "TRANSACTION_CREATED",
      TransactionStatus.SUBMITTED,
    );
    expect(
      (
        await getTransactions([
          TransactionStatus.CANCELLED,
          TransactionStatus.CONFIRMING,
          TransactionStatus.PENDING_SIGNATURE,
          TransactionStatus.SUBMITTED,
        ])
      ).body,
    ).toHaveLength(2);
  });

  it("should handle polling transactions", async () => {
    const txId = "txId123";

    await createUser();
    await createWallet();

    expect((await getTransactions()).body).toEqual([]);

    const poll1 = getTransactions([TransactionStatus.CONFIRMING], true);
    const poll2 = getTransactions(
      [TransactionStatus.CONFIRMING, TransactionStatus.PENDING_SIGNATURE],
      true,
    );
    const poll3 = getTransactions(undefined, true);

    await webhookTransaction(
      txId,
      "TRANSACTION_CREATED",
      TransactionStatus.CONFIRMING,
    );

    expect((await poll1).body).toMatchObject([{ id: txId }]);
    expect((await poll2).body).toMatchObject([{ id: txId }]);
    expect((await poll3).body).toMatchObject([{ id: txId }]);
  });

  it("should get assets", async () => {
    when(fireblocksSdk.getFeeForAsset(anything())).thenResolve({
      low: {},
      medium: {},
      high: {},
    });
    when(ncw.getWalletAssets(walletId, 0)).thenResolve({
      data: Object.values(assetInfoMock),
    });
    await createUser();
    await createWallet();
    await getAssets();
  });

  it("should get asset address", async () => {
    const asset = "BTC_TEST";
    const address: NCW.WalletAssetAddress = {
      accountName: walletId,
      accountId: "0",
      asset,
      address: "123",
      addressType: "aaa",
    };

    when(ncw.getWalletAssetAddresses(walletId, 0, asset)).thenResolve({
      data: [address],
    });

    await createUser();
    await createWallet();

    expect((await getAssetAddress(asset)).body).toEqual(address);
  });
});
