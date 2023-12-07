import { NextFunction, Response } from "express";
import { RequestEx } from "../interfaces/requestEx";
import { WalletService } from "../services/wallet.service";

export class WalletController {
  constructor(private readonly service: WalletService) {}

  async findAll(req: RequestEx, res: Response, next: NextFunction) {
    const { auth } = req;
    const { sub } = auth!.payload;

    try {
      const wallets = await this.service.findAll(sub!);
      res.json({
        wallets: wallets.map(({ id }) => ({
          walletId: id,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  async getLatestBackup(req: RequestEx, res: Response, next: NextFunction) {
    const { wallet } = req;

    try {
      const response = await this.service.getLatestBackup(wallet!.id);
      res.json(response);
    } catch (err) {
      return next(err);
    }
  }
}
