import { CryptoClient, LatestQuotesResponse } from "coinmarketcap-js";
import { LRUCache } from "lru-cache";
import ms from "ms";

// note: example only, you might want to configure according to:
// https://coinmarketcap.com/api/documentation/v1/#section/Standards-and-Conventions
const cache = new LRUCache<string, LatestQuotesResponse, CryptoClient>({
  max: 100,
  ttl: ms("1 min"),
  fetchMethod: (symbol, _stale, { context }) =>
    context.latestQuotes({
      symbol,
      convert: "usd",
    }),
});

export async function getUsdRateForAsset(asset: string, cmc: CryptoClient) {
  try {
    // try to mock real asset value for test assets
    const symbol = asset.replace(/_TEST.*/, "");
    let quotes = await cache.fetch(symbol, { context: cmc });
    if (!quotes) {
      throw Error(`failed to fetch ${symbol}`);
    }
    return quotes.data[symbol].quote["USD"].price;
  } catch (e) {
    console.warn(`failed getting rate for asset ${asset}`, e);
    return null;
  }
}
