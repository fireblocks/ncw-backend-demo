import { createApp } from "./app";
import { FireblocksSDK } from "fireblocks-sdk";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import CoinMarketcap from "coinmarketcap-js";
import ms from "ms";

import { staleMessageCleanup } from "./services/message.service";

dotenv.config();

const port = process.env.PORT;

const webhookPublicKey = process.env.FIREBLOCKS_WEBHOOK_PUBLIC_KEY!.replace(
  /\\n/g,
  "\n",
);
const apiSecret = process.env.FIREBLOCKS_API_SECRET!.replace(/\\n/g, "\n");

const apiKeyCmc = process.env.CMC_PRO_API_KEY!;
const apiKeyNcwSigner = process.env.FIREBLOCKS_API_KEY_NCW_SIGNER!;
const apiKeyNcwAdmin = process.env.FIREBLOCKS_API_KEY_NCW_ADMIN!;
const apiBase = process.env.FIREBLOCKS_API_BASE_URL;

const signer = new FireblocksSDK(apiSecret, apiKeyNcwSigner, apiBase);
const admin = new FireblocksSDK(apiSecret, apiKeyNcwAdmin, apiBase);

// You must provide either an 'issuerBaseURL', or an 'issuer' and 'jwksUri'
const issuerBaseURL = process.env.ISSUER_BASE_URL;
const issuer = process.env.ISSUER;
const jwksUri = process.env.JWKS_URI;
const audience = process.env.AUDIENCE;

const authOptions = {
  jwksUri,
  issuer,
  issuerBaseURL,
  audience,
};

const clients = {
  signer,
  admin,
  cmc: CoinMarketcap(apiKeyCmc).crypto,
};

const app = createApp(authOptions, clients, webhookPublicKey);

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);

      // should be distributed scheduled task in production
      setInterval(staleMessageCleanup, ms("1 hour"));
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
    process.exit(1);
  });
