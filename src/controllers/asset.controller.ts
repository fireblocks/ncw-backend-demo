import { NextFunction, Response } from "express";
import { RequestEx } from "../interfaces/requestEx";
import { AssetService } from "../services/asset.service";

export class AssetController {
  constructor(private readonly service: AssetService) {}

  async findAll(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId } = params;

    try {
      const { walletId } = device!;
      const assets = await this.service.findAll(walletId, Number(accountId));
      return res.json(assets);
    } catch (err) {
      return next(err);
    }
  }

  async findOne(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId, assetId } = params;

    try {
      const { walletId } = device!;
      const asset = this.service.findOne(walletId, Number(accountId), assetId);
      return res.json(asset);
    } catch (err) {
      return next(err);
    }
  }

  async addAsset(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId, assetId } = params;

    try {
      const { walletId } = device!;
      const asset = await this.service.addAsset(
        walletId,
        Number(accountId),
        assetId,
      );
      return res.json(asset);
    } catch (err) {
      return next(err);
    }
  }

  async getBalance(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId, assetId } = params;

    try {
      const { walletId } = device!;
      const balance = await this.service.getBalance(
        walletId,
        Number(accountId),
        assetId,
      );
      return res.json(balance);
    } catch (err) {
      return next(err);
    }
  }

  async getAddress(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId, assetId } = params;

    try {
      const { walletId } = device!;
      const address = await this.service.getAddress(
        walletId,
        Number(accountId),
        assetId,
      );
      return res.json(address);
    } catch (err) {
      return next(err);
    }
  }
}
