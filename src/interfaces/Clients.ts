import { FireblocksSDK } from "fireblocks-sdk";
import { CryptoClient } from "coinmarketcap-js";

export interface Clients {
  signer: FireblocksSDK;
  admin: FireblocksSDK;
  cmc: CryptoClient;
}
