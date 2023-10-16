import { NextFunction, Response } from "express";
import { RequestEx } from "../interfaces/requestEx";
import { Clients } from "../interfaces/Clients";
import { fetchAll } from "../util/fetch-all";

export class AccountContoller {
  constructor(private readonly clients: Clients) {}

  async findAll(req: RequestEx, res: Response, next: NextFunction) {
    const { device } = req;
    try {
      const { walletId } = device!;
      const accounts = await fetchAll((page) =>
        this.clients.admin.NCW.getWalletAccounts(walletId, page),
      );
      return res.json(accounts);
    } catch (err) {
      return next(err);
    }
  }
}
