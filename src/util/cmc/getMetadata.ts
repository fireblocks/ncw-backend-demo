import { CryptoClient, InfoQueryParams, Metadata } from "coinmarketcap-js";
import { LRUCache } from "lru-cache";
import ms from "ms";
import { symbolMockTestTransform } from "./symbolMockTestTransform";
import { banlist } from "./banlist";

// note: example only, you might want to configure according to:
// https://coinmarketcap.com/api/documentation/v1/#section/Standards-and-Conventions
const cache = new LRUCache<string, Metadata>({
  max: 50000,
  ttl: ms("1 month"),
});

interface IExtendedInfoQueryParams extends InfoQueryParams {
  skipInvalid?: boolean;
}

export async function getMetadataForAsset(
  asset: string,
  cmc: CryptoClient,
): Promise<Metadata | undefined> {
  return (await getMetadataForAssets([asset], cmc))[asset];
}

export async function getMetadataForAssets(
  assets: string[],
  cmc: CryptoClient,
): Promise<Record<string, Metadata | undefined>> {
  try {
    const symbols = [
      ...new Set(assets.map(symbolMockTestTransform)).values(),
    ].filter((a) => !banlist.has(a));

    if (symbols.length === 0) {
      return {};
    }

    const missingSymbols = symbols.filter((s) => cache.has(s)).join(",");
    if (missingSymbols.length) {
      const params: IExtendedInfoQueryParams = {
        symbol: missingSymbols,
        aux: "logo",
        skipInvalid: true,
      };

      const meta = await cmc.info(params);

      if (!meta?.data) {
        throw Error(`failed to fetch metadata`);
      }

      for (const symbol of symbols) {
        if (!meta.data[symbol]) {
          banlist.set(symbol, new Date());
          continue;
        }

        cache.set(symbol, meta.data[symbol]);
      }
    }

    return Object.fromEntries(
      assets.map((a) => [a, cache.get(symbolMockTestTransform(a))]),
    );
  } catch (e) {
    console.warn(`failed getting metadata for assets ${assets}`, e);
    return {};
  }
}
