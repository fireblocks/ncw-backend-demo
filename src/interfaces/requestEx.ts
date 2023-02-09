import { Device } from "../model/device";
import { Request } from "express";

export interface RequestEx extends Request {
  device?: Device;
}
