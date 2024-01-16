import { NextFunction, Response, Request } from "express";
import { AssetService } from "../services/asset.service";
import { NCW } from "fireblocks-sdk";

export class AssetController {
  constructor(private readonly service: AssetService) {}

  async summary(req: Request, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId } = params;

    try {
      const { walletId } = device!;
      const summary = await this.service.summary(walletId, Number(accountId));
      return res.json(summary);
    } catch (err) {
      return next(err);
    }
  }

  async getSupportedAssets(req: Request, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId } = params;

    try {
      const { walletId } = device!;

      const all = (
        await this.service.findAll(walletId, Number(accountId), false, false)
      ).reduce<{ [assetId: string]: NCW.WalletAssetResponse }>((acc, v) => {
        acc[v.id] = v;
        return acc;
      }, {});

      const assets = (await this.service.getSupportedAssets()).filter(
        (asset) =>
          !(asset.id in all) &&
          (asset.type === "BASE_ASSET" || asset.baseAsset in all),
      );

      return res.json(assets);
    } catch (err) {
      return next(err);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
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

  async findOne(req: Request, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId, assetId } = params;

    try {
      const { walletId } = device!;
      const asset = await this.service.findOne(
        walletId,
        Number(accountId),
        assetId,
      );
      return res.json(asset);
    } catch (err) {
      return next(err);
    }
  }

  async addAsset(req: Request, res: Response, next: NextFunction) {
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

  async getBalance(req: Request, res: Response, next: NextFunction) {
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

  async getAddress(req: Request, res: Response, next: NextFunction) {
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
