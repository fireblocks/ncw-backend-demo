import {
  BaseEntity,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { Device } from "./device";
import { Transaction } from "./transaction";

@Entity()
export class Wallet extends BaseEntity {
  @PrimaryColumn({ nullable: false, length: 64 })
  id: string;

  @OneToMany(() => Device, (device) => device.wallet)
  devices: Device[];

  @ManyToMany(() => Transaction, (transaction) => transaction.wallets)
  @JoinTable({
    name: "wallets_txs",
    joinColumn: {
      name: "walletId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "txId",
      referencedColumnName: "id",
    },
  })
  transactions: Transaction[];
}
