import { Device } from "../model/device";
import { Request } from "express";
import { Wallet } from "../model/wallet";

declare module "express-serve-static-core" {
  export interface Request {
    auth: {
      token: string;
      payload: any;
    };
    device?: Device;
    wallet?: Wallet;
  }
}
