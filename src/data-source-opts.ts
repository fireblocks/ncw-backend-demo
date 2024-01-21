import dotenv from "dotenv";

import { DataSourceOptions } from "typeorm";
import { Device } from "./model/device";
import { User } from "./model/user";
import { Wallet } from "./model/wallet";
import { Transaction } from "./model/transaction";
import { TransactionSubscriber } from "./subscribers/transaction.subscriber";
import { Passphrase } from "./model/passphrase";
dotenv.config();

const opts: DataSourceOptions = {
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [User, Wallet, Device, Transaction, Passphrase],
  subscribers: [TransactionSubscriber],
  migrations: ["./dist/migrations/*.js"],
};

export default opts;
