import { createConnection, getConnection } from "typeorm";
import { Device } from "../model/device";
import { Message } from "../model/message";
import { User } from "../model/user";
import { Wallet } from "../model/wallet";
import { MessageSubscriber } from "./message.subscriber";
import { Transaction } from "../model/transaction";

describe("message subscriber", () => {
  const deviceId = "123";
  const physicalDeviceId = "333";

  beforeEach(async () => {
    const conn = await createConnection({
      type: "better-sqlite3",
      database: ":memory:",
      dropSchema: true,
      subscribers: [MessageSubscriber],
      entities: [Wallet, Device, Message, User, Transaction],
      synchronize: true,
      logging: false,
    });
    await conn.synchronize();

    const user = new User();
    user.sub = "sub";
    await user.save();

    const wallet = new Wallet();
    wallet.id = "zzz";
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

  it("should resolve wait for messages on message insert", async () => {
    const sub = new MessageSubscriber();
    const prom = sub.waitForMessages(deviceId, 20_000);

    const msg = new Message();
    msg.deviceId = deviceId;
    msg.message = "hi";
    expect(msg.lastSeen).toBeUndefined();
    await msg.save();
    expect(msg.lastSeen).toBeDefined();

    const recv = await prom;
    expect(recv[0]).toMatchObject(msg);
  });

  it("should resolve wait for messages on message insert physical device", async () => {
    const sub = new MessageSubscriber();

    const prom = sub.waitForMessages(deviceId, 20_000, physicalDeviceId);

    const msg = new Message();
    msg.deviceId = deviceId;
    msg.message = "hi";
    msg.physicalDeviceId = physicalDeviceId;

    expect(msg.lastSeen).toBeUndefined();
    await msg.save();
    expect(msg.lastSeen).toBeDefined();

    const recv = await prom;
    expect(recv[0]).toMatchObject(msg);
  });
});
