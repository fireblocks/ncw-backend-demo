import { NCW } from "fireblocks-sdk";

const ETH = {
  id: "ETH",
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  testnet: false,
  hasFee: true,
  type: "BASE_ASSET",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 60,
  blockchain: "ETH",
  ethContractAddress: undefined,
  networkProtocol: "ETH",
  baseAsset: "ETH",
  ethNetwork: 1,
};

const BTC = {
  id: "BTC",
  symbol: "BTC",
  name: "Bitcoin",
  decimals: 8,
  testnet: false,
  hasFee: true,
  type: "BASE_ASSET",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 0,
  blockchain: "BTC",
  ethContractAddress: undefined,
  networkProtocol: "BTC",
  baseAsset: "BTC",
  ethNetwork: undefined,
};

const BTC_TEST = {
  id: "BTC_TEST",
  symbol: "BTC_TEST",
  name: "Bitcoin Test",
  decimals: 8,
  testnet: true,
  hasFee: true,
  type: "BASE_ASSET",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 1,
  blockchain: "BTC_TEST",
  ethContractAddress: undefined,
  networkProtocol: "BTC",
  baseAsset: "BTC_TEST",
  ethNetwork: undefined,
};

const SOL = {
  id: "SOL",
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  testnet: false,
  hasFee: true,
  type: "BASE_ASSET",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 501,
  blockchain: "SOL",
  ethContractAddress: undefined,
  networkProtocol: "SOL",
  baseAsset: "SOL",
  ethNetwork: undefined,
};

const UNI = {
  id: "UNI",
  symbol: "UNI",
  name: "Uniswap",
  decimals: 18,
  testnet: false,
  hasFee: true,
  type: "ERC20",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 60,
  blockchain: "ETH",
  ethContractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  networkProtocol: "ETH",
  baseAsset: "ETH",
  ethNetwork: 1,
};

const DOGE = {
  id: "DOGE",
  symbol: "DOGE",
  name: "Doge Coin",
  decimals: 8,
  testnet: false,
  hasFee: true,
  type: "BASE_ASSET",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 3,
  blockchain: "DOGE",
  ethContractAddress: undefined,
  networkProtocol: "BTC",
  baseAsset: "DOGE",
  ethNetwork: undefined,
};

const WETH = {
  id: "WETH",
  symbol: "WETH",
  name: "Wrapped Ether",
  decimals: 18,
  testnet: false,
  hasFee: true,
  type: "ERC20",
  issuerAddress: undefined,
  blockchainSymbol: undefined,
  deprecated: false,
  coinType: 60,
  blockchain: "ETH",
  ethContractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  networkProtocol: "ETH",
  baseAsset: "ETH",
  ethNetwork: 1,
};

const assets: NCW.WalletAssetResponse[] = [
  ETH,
  BTC,
  BTC_TEST,
  DOGE,
  UNI,
  SOL,
  WETH,
];

export const assetInfoMock = Object.fromEntries(assets.map((a) => [a.id, a]));

export const baseAssetInfoMock = Object.fromEntries(
  assets.filter((a) => a.type === "BASE_ASSET").map((a) => [a.id, a]),
);

export const nonBaseAssetInfoMock = Object.fromEntries(
  assets.filter((a) => a.type !== "BASE_ASSET").map((a) => [a.id, a]),
);
