import { Device } from "../model/device";
import { Request } from "express";
import { Wallet } from "../model/wallet";

export interface RequestEx extends Request {
  device?: Device;
  wallet?: Wallet;
}
