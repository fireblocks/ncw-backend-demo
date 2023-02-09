import ms from "ms";
import { Clients } from "../interfaces/Clients";
import { getUsdRateForAsset } from "../util/getUsdRate";
import { LRUCache } from "lru-cache";
import { EstimateFeeResponse } from "fireblocks-sdk";

export class AssetService {
  private feeCache: LRUCache<string, EstimateFeeResponse>;

  constructor(private readonly clients: Clients) {
    this.feeCache = new LRUCache<string, EstimateFeeResponse>({
      max: 100,
      ttl: ms("1m"),
      fetchMethod: (assetId) => this.clients.admin.getFeeForAsset(assetId),
    });
  }

  async findAll(walletId: string, accountId: number) {
    const assets = await this.clients.admin.NCW.getWalletAssets(
      walletId,
      accountId,
    );
    return await Promise.all(
      assets.data.map(async (asset) => ({
        ...asset,
        fee: await this.feeCache.fetch(asset.id),
        rate: await getUsdRateForAsset(asset.symbol, this.clients.cmc),
      })),
    );
  }

  async findOne(walletId: string, accountId: number, assetId: string) {
    const asset = await this.clients.admin.NCW.getWalletAsset(
      walletId,
      Number(accountId),
      assetId,
    );
    const fee = await this.feeCache.fetch(asset.id);
    const rate = await getUsdRateForAsset(asset.symbol, this.clients.cmc);
    return { ...asset, fee, rate };
  }

  async addAsset(walletId: string, accountId: number, assetId: string) {
    const asset = await this.clients.signer.NCW.activateWalletAsset(
      walletId,
      Number(accountId),
      assetId,
    );
    return asset;
  }

  async getBalance(walletId: string, accountId: number, assetId: string) {
    const balance = await this.clients.admin.NCW.getWalletAssetBalance(
      walletId,
      Number(accountId),
      assetId,
    );
    return balance;
  }

  async getAddress(walletId: string, accountId: number, assetId: string) {
    const addresses = await this.clients.admin.NCW.getWalletAssetAddresses(
      walletId,
      Number(accountId),
      assetId,
    );
    return addresses.data[0];
  }
}
