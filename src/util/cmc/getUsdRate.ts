import { CryptoClient, QuoteData } from "coinmarketcap-js";
import { LRUCache } from "lru-cache";
import ms from "ms";
import { symbolMockTestTransform } from "./symbolMockTestTransform";
import { banlist } from "./banlist";

// note: example only, you might want to configure according to:
// https://coinmarketcap.com/api/documentation/v1/#section/Standards-and-Conventions
const cache = new LRUCache<string, QuoteData, CryptoClient>({
  max: 10000,
  ttl: ms("1 min"),
});

export async function getUsdRateForAsset(
  asset: string,
  cmc: CryptoClient,
): Promise<number | undefined> {
  return (await getUsdRateForAssets([asset], cmc))[asset];
}

export async function getUsdRateForAssets(
  asset: string[],
  cmc: CryptoClient,
): Promise<Record<string, number | undefined>> {
  try {
    const symbols = [
      ...new Set(asset.map(symbolMockTestTransform)).values(),
    ].filter((a) => !banlist.has(a));

    if (symbols.length === 0) {
      return {};
    }

    const missingSymbols = symbols.filter((s) => !cache.has(s));
    if (missingSymbols.length) {
      const quotes = await cmc.latestQuotes({
        symbol: missingSymbols.join(","),
        convert: "usd",
        skipInvalid: true,
      });

      if (!quotes?.data) {
        throw Error(`failed to fetch quotes`);
      }

      for (const symbol of missingSymbols) {
        if (!quotes.data[symbol]) {
          banlist.set(symbol, new Date());
          continue;
        }

        cache.set(symbol, quotes.data[symbol].quote["USD"]);
      }
    }

    return Object.fromEntries(
      asset.map((a) => [a, cache.get(symbolMockTestTransform(a))?.price]),
    );
  } catch (e) {
    console.warn(`failed getting rate for asset ${asset}`, e);
    return {};
  }
}
