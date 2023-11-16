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

export enum PassphraseLocation {
  GoogleDrive = "GoogleDrive",
  iCloud = "iCloud",
}

@Entity()
export class Passphrase extends BaseEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  location: PassphraseLocation;

  @ManyToOne(() => User, (user) => user.passphrases, { cascade: true })
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
