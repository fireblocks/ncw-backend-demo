import ms from "ms";
import { Clients } from "../interfaces/Clients";
import {
  getUsdRateForAsset,
  getUsdRateForAssets,
} from "../util/cmc/getUsdRate";
import { LRUCache } from "lru-cache";
import { AssetResponse, EstimateFeeResponse, NCW } from "fireblocks-sdk";
import { fetchAll } from "../util/fetch-all";
import {
  getMetadataForAsset,
  getMetadataForAssets,
} from "../util/cmc/getMetadata";
import { Metadata } from "coinmarketcap-js";

export type TAssetSummary = {
  asset: IAsset;
  address: NCW.WalletAssetAddress;
  balance: AssetResponse;
};

export type IAssetSummaryMap = { [assetId: string]: TAssetSummary };

export interface IAsset extends NCW.WalletAssetResponse {
  fee?: EstimateFeeResponse;
  rate?: number;
  iconUrl?: string;
}

export class AssetService {
  private feeCache: LRUCache<string, EstimateFeeResponse>;
  private supportedAssets?: Array<IAsset> = undefined;

  constructor(private readonly clients: Clients) {
    this.feeCache = new LRUCache<string, EstimateFeeResponse>({
      max: 1000,
      ttl: ms("1m"),
      fetchMethod: async (assetId) => {
        try {
          return await this.clients.admin.getFeeForAsset(assetId);
        } catch (e) {
          console.warn(`failed getting fee for ${assetId}`, e);
        }
      },
    });
  }

  async getSupportedAssets(): Promise<Array<IAsset>> {
    if (!this.supportedAssets) {
      const assets = await fetchAll<IAsset>(async (page) => {
        const results = await this.clients.admin.NCW.getSupportedAssets(page);
        const meta = await getMetadataForAssets(
          results.data.map((a) => a.symbol),
          this.clients.cmc,
        );
        return {
          ...results,
          data: results.data.map((asset) => ({
            ...asset,
            iconUrl: meta[asset.symbol]?.logo,
          })),
        };
      });
      this.supportedAssets = assets;
    }

    return this.supportedAssets;
  }

  async findAll(
    walletId: string,
    accountId: number,
    fee = true,
    rate = true,
    meta = true,
  ): Promise<Array<IAsset>> {
    const assets = await fetchAll<IAsset>(async (page) => {
      const response = await this.clients.admin.NCW.getWalletAssets(
        walletId,
        accountId,
        page,
      );

      const [rates, metadata] = await Promise.all([
        rate
          ? await getUsdRateForAssets(
              response.data.map((a) => a.symbol),
              this.clients.cmc,
            )
          : Promise.resolve<Record<string, number>>({}),
        meta
          ? await getMetadataForAssets(
              response.data.map((a) => a.symbol),
              this.clients.cmc,
            )
          : Promise.resolve<Record<string, Metadata>>({}),
      ]);

      return {
        ...response,
        data: response.data.map((asset) => ({
          ...asset,
          rate: rates[asset.symbol],
          iconUrl: metadata[asset.symbol]?.logo,
        })),
      };
    });

    return await Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        fee:
          asset.hasFee && fee ? await this.feeCache.fetch(asset.id) : undefined,
      })),
    );
  }

  async findOne(
    walletId: string,
    accountId: number,
    assetId: string,
  ): Promise<IAsset> {
    const asset = await this.clients.admin.NCW.getWalletAsset(
      walletId,
      Number(accountId),
      assetId,
    );

    const fee = asset.hasFee ? await this.feeCache.fetch(asset.id) : undefined;
    const rate = await getUsdRateForAsset(asset.symbol, this.clients.cmc);
    const iconUrl = (await getMetadataForAsset(asset.symbol, this.clients.cmc))
      ?.logo;

    return { ...asset, fee, rate, iconUrl };
  }

  async summary(
    walletId: string,
    accountId: number,
  ): Promise<IAssetSummaryMap> {
    const assets = await this.findAll(walletId, Number(accountId));
    const result = await Promise.all(
      assets.map(async (asset) => ({
        asset,
        address: await this.getAddress(walletId, Number(accountId), asset.id),
        balance: await this.getBalance(walletId, Number(accountId), asset.id),
      })),
    );
    return result.reduce<IAssetSummaryMap>((acc, e) => {
      acc[e.asset.id] = e;
      return acc;
    }, {});
  }

  async addAsset(walletId: string, accountId: number, assetId: string) {
    const address = await this.clients.signer.NCW.activateWalletAsset(
      walletId,
      Number(accountId),
      assetId,
    );
    return address;
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
