import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user";
import { Wallet } from "./wallet";

@Entity()
export class Device extends BaseEntity {
  @PrimaryColumn("uuid", { nullable: false, length: 64 })
  id: string;

  @Column({ nullable: false })
  userId: number;

  @Column({ type: "uuid", nullable: false, length: 64 })
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.devices, { cascade: true })
  @JoinColumn({ name: "walletId", referencedColumnName: "id" })
  wallet: Wallet;

  @ManyToOne(() => User, (user) => user.devices, { cascade: true })
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
