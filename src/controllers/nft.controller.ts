import { NFTService } from "../services/nft.service";
import { NextFunction, Response, Request } from "express";

export class NFTController {
  constructor(private readonly service: NFTService) {}

  async getOwnedNFTs(req: Request, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { accountId } = params;

    try {
      const { walletId } = device!;
      const nfts = await this.service.getOwnedNFTs(walletId, [accountId]);
      return res.json(nfts);
    } catch (err) {
      return next(err);
    }
  }

  async listOwnedCollections(req: Request, res: Response, next: NextFunction) {
    const { device } = req;

    try {
      const { walletId } = device!;
      const collections = await this.service.listOwnedCollections(walletId);
      return res.json(collections);
    } catch (err) {
      return next(err);
    }
  }

  async listOwnedAssets(req: Request, res: Response, next: NextFunction) {
    const { device } = req;

    try {
      const { walletId } = device!;
      const assets = await this.service.listOwnedAssets(walletId);
      return res.json(assets);
    } catch (err) {
      return next(err);
    }
  }
}
