import { LatestQuotes, LatestQuotesResponse } from "coinmarketcap-js";

export function mockQuoteResponse(
  price = 1,
  ...assets: string[]
): LatestQuotesResponse {
  const date = Date.now();
  const quotes: LatestQuotes = assets
    .map((asset) => ({
      id: 0,
      name: asset,
      symbol: asset,
      slug: "",
      isActive: 0,
      isFiat: 0,
      circulatingSupply: 0,
      totalSupply: 0,
      maxSupply: 0,
      dateAdded: "",
      numMarketPairs: 0,
      cmcRank: 0,
      lastUpdated: date.toString(),
      tags: [],
      platform: {
        id: 0,
        name: "",
        symbol: "",
        slug: "",
        tokenAddress: "",
      },
      selfReportedCirculatingSupply: 0,
      selfReportedMarketCap: 0,
      quote: {
        USD: {
          price,
          volume24h: 0,
          volumeChange24h: 0,
          volume24hReported: 0,
          volume7d: 0,
          volume7dReported: 0,
          volume30d: 0,
          volume30dReported: 0,
          marketCap: 0,
          marketCapDominance: 0,
          fullyDilutedMarketCap: 0,
          percentChange1h: 0,
          percentChange24h: 0,
          percentChange7d: 0,
          percentChange30d: 0,
          lastUpdated: date.toString(),
        },
      },
    }))
    .reduce<LatestQuotes>((acc, curr) => {
      acc[curr.symbol] = curr;
      return acc;
    }, {});

  const resp: LatestQuotesResponse = {
    status: {
      timestamp: date.toString(),
      errorCode: 0,
      errorMessage: "",
      elapsed: 0,
      creditCount: 0,
    },
    data: quotes,
  };
  return resp;
}
