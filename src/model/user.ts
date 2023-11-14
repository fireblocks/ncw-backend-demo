import {
  BaseEntity,
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Device } from "./device";
import { Passphrase } from "./passphrase";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ nullable: false })
  sub: string;

  @OneToMany(() => Device, (device) => device.userId)
  devices: Device[];

  @OneToMany(() => Passphrase, (passphrase) => passphrase.userId)
  passphrases: Passphrase[];
}
