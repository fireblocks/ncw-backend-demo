import { InfoResponse, Metadata } from "coinmarketcap-js";

export function mockInfoResponse(...assets: string[]): InfoResponse {
  const base: Metadata = {
    id: 0,
    name: "",
    symbol: "",
    category: "",
    slug: "",
    logo: "",
    description: "",
    dateAdded: "",
    dateLaunched: "",
    notice: "",
    tags: [],
    selfReportedCirculatingSupply: 0,
    selfReportedMarketCap: 0,
    selfReportedTags: [],
    platform: {
      id: 0,
      name: "",
      symbol: "",
      slug: "",
      tokenAddress: "",
    },
    urls: {
      website: [],
      technicalDoc: [],
      explorer: [],
      sourceCode: [],
      messageBoard: [],
      chat: [],
      announcement: [],
      reddit: [],
      twitter: [],
    },
  };

  const res: InfoResponse = {
    status: {
      timestamp: "",
      errorCode: 0,
      errorMessage: "",
      elapsed: 0,
      creditCount: 0,
    },
    data: Object.fromEntries(
      assets.map((a) => [a, { ...base, logo: `https://test/${a}.png` }]),
    ),
  };
  return res;
}
