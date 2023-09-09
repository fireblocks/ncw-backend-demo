import { NextFunction, Response } from "express";
import { RequestEx } from "../interfaces/requestEx";
import { DeviceService } from "../services/device.service";
import { create } from "domain";

export class DeviceController {
  constructor(private readonly service: DeviceService) {}

  async assign(req: RequestEx, res: Response, next: NextFunction) {
    const { auth, params } = req;
    const { sub } = auth!.payload;
    const { deviceId } = params;

    try {
      // check if device was already assigned wallet
      const prevDevice = await this.service.findOne(deviceId);
      if (prevDevice) {
        if (prevDevice.user.sub !== sub) {
          return res.status(401).send();
        }
        if (prevDevice.walletId) {
          return res.json({ walletId: prevDevice.walletId });
        }

        throw new Error("Invalid state");
      }

      const { walletId } = await this.service.assign(deviceId, sub!);
      res.json({ walletId });
    } catch (err) {
      next(err);
    }
  }

  async findAll(req: RequestEx, res: Response, next: NextFunction) {
    const { auth } = req;
    const { sub } = auth!.payload;

    try {
      const devices = await this.service.findAll(sub!);
      res.json({
        devices: devices.map(({ id, walletId, createdAt }) => ({
          deviceId: id,
          walletId,
          createdAt: createdAt.valueOf(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  async rpc(req: RequestEx, res: Response, next: NextFunction) {
    const { params, device } = req;
    const { deviceId } = params;
    const { message } = req.body;

    try {
      const { walletId } = device!;
      console.log(
        `sending rpc to Fireblocks (device ${device?.id}) ->`,
        message,
      );
      const response = await this.service.rpc(walletId, deviceId, message);
      console.log(`received rpc response (device ${device?.id}) <-`, response);
      res.json(response);
    } catch (err) {
      return next(err);
    }
  }
}
