import { NextFunction, Response } from "express";
import { Web3ConnectionFeeLevel } from "fireblocks-sdk";
import { RequestEx } from "../interfaces/requestEx";
import { Web3Service } from "../services/web3.service";

export class Web3Controller {
  constructor(private readonly service: Web3Service) {}

  async find(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;

    try {
      const { walletId } = device!;
      const connections = await this.service.find(walletId);
      return res.json(connections);
    } catch (err) {
      return next(err);
    }
  }

  async create(req: RequestEx, res: Response, next: NextFunction) {
    const { device, body } = req;
    const {
      uri,
      accountId = "0",
      feeLevel = Web3ConnectionFeeLevel.MEDIUM,
    } = body;

    try {
      const { walletId } = device!;

      const session = await this.service.create(
        walletId,
        Number(accountId),
        uri,
        feeLevel,
      );
      res.json(session);
    } catch (err) {
      return next(err);
    }
  }

  async approve(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { sessionId } = params;

    try {
      const { walletId } = device!;
      await this.service.approve(walletId, sessionId);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  async deny(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { sessionId } = params;

    try {
      const { walletId } = device!;
      await this.service.deny(walletId, sessionId);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  async remove(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { sessionId } = params;

    try {
      const { walletId } = device!;
      await this.service.remove(walletId, sessionId);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
}
