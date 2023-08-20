import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryColumn,
} from "typeorm";
import { ITransactionDetails } from "../interfaces/transaction";
import { Wallet } from "./wallet";
import { TransactionStatus } from "fireblocks-sdk";

@Entity()
export class Transaction extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "varchar", nullable: false, length: 255 })
  @Index()
  status: TransactionStatus;

  @Column({ type: "datetime", nullable: false, default: () => "NOW()" })
  @Index()
  createdAt: Date;

  @Column({ type: "datetime", nullable: false, default: () => "NOW()" })
  @Index()
  lastUpdated: Date;

  @Column({
    nullable: false,
    // note: during tests we use typeorm with sqlite which doesn't support "json" columns
    type: process.env.NODE_ENV === "test" ? "simple-json" : "json",
  })
  details: ITransactionDetails;

  @ManyToMany(() => Wallet, (wallet) => wallet.transactions)
  wallets: Wallet[];
}
