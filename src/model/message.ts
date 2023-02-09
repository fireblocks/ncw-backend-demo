import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Device } from "./device";

@Entity()
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", nullable: false, length: 64 })
  deviceId: string;

  @Column({ type: "uuid", nullable: true, length: 64 })
  physicalDeviceId?: string;

  @Index()
  @ManyToOne(() => Device, (device) => device.msgs)
  @JoinColumn([{ name: "deviceId", referencedColumnName: "id" }])
  device: Device;

  @Column({
    nullable: false,
    type: process.env.NODE_ENV === "test" ? "text" : "longtext",
  })
  message: string;

  @Index()
  @Column({ type: "datetime", nullable: true, name: "last_seen" })
  lastSeen?: Date;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
