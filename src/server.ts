import { createApp } from "./app";
import { FireblocksSDK } from "fireblocks-sdk";
import dotenv from "dotenv";
import { appDataSource } from "./data-source";
import CoinMarketcap from "coinmarketcap-js";
import ms from "ms";
import { staleMessageCleanup } from "./services/message.service";
import { getEnvOrThrow } from "./util/env";
import { HttpsAgent } from "agentkeepalive";
import { AuthOptions } from "./middleware/jwt";
import { createRemoteJWKSet } from "jose";
import { Issuer } from "openid-client";

// use keepalive agent to reuse connections to Fireblocks API
const keepaliveAgent = new HttpsAgent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60_000, // active socket keepalive for 60 seconds
  freeSocketTimeout: 30_000, // free socket keepalive for 30 seconds
});

dotenv.config();

const port = process.env.PORT;

const enablePolling = Boolean(process.env.ENABLE_POLLING);

const DEFAULT_ORIGIN = [
  "http://localhost:5173",
  "https://fireblocks.github.io",
];

function getOriginFromEnv(): string[] {
  if (process.env.ORIGIN_WEB_SDK !== undefined) {
    const origin = process.env.ORIGIN_WEB_SDK;
    return origin.split(",");
  }
  return DEFAULT_ORIGIN;
}

const webhookPublicKey = getEnvOrThrow("FIREBLOCKS_WEBHOOK_PUBLIC_KEY").replace(
  /\\n/g,
  "\n",
);
const apiSecret = getEnvOrThrow("FIREBLOCKS_API_SECRET").replace(/\\n/g, "\n");

const apiKeyCmc = getEnvOrThrow("CMC_PRO_API_KEY");
const apiKeyNcwSigner = getEnvOrThrow("FIREBLOCKS_API_KEY_NCW_SIGNER");
const apiKeyNcwAdmin = getEnvOrThrow("FIREBLOCKS_API_KEY_NCW_ADMIN");
const apiBase = process.env.FIREBLOCKS_API_BASE_URL;

const signer = new FireblocksSDK(
  apiSecret,
  apiKeyNcwSigner,
  apiBase,
  undefined,
  { httpsAgent: keepaliveAgent },
);
const admin = new FireblocksSDK(apiSecret, apiKeyNcwAdmin, apiBase, undefined, {
  httpsAgent: keepaliveAgent,
});

// You must provide either an 'issuerBaseURL', or an 'issuer' and 'jwksUri'
const issuerBaseURL = process.env.ISSUER_BASE_URL;
const issuer = process.env.ISSUER;
const jwksUri = process.env.JWKS_URI;
const audience = process.env.AUDIENCE;

const clients = {
  signer,
  admin,
  cmc: CoinMarketcap(apiKeyCmc).crypto,
};

const origin = getOriginFromEnv();

async function createAuthOptions() {
  let authOptions: AuthOptions;

  if (issuerBaseURL) {
    const issuerClient = await Issuer.discover(issuerBaseURL);
    authOptions = {
      key: createRemoteJWKSet(new URL(issuerClient.metadata.jwks_uri!)),
      verify: {
        issuer: issuerClient.metadata.issuer,
        audience,
      },
    };
  } else if (jwksUri) {
    authOptions = {
      key: createRemoteJWKSet(new URL(jwksUri)),
      verify: {
        issuer,
        audience,
      },
    };
  } else {
    throw new Error("Failed to resolve issuer");
  }
  return authOptions;
}

async function init() {
  try {
    await appDataSource.initialize();

    console.log("Data Source has been initialized!");

    const authOptions: AuthOptions = await createAuthOptions();
    const { app, socketIO } = createApp(
      authOptions,
      clients,
      webhookPublicKey,
      origin,
      enablePolling,
    );
    const server = app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);

      // should be distributed scheduled task in production
      setInterval(() => {
        void staleMessageCleanup();
      }, ms("1 hour"));
    });

    // set higher keepalive timeout (default: 5s)
    server.keepAliveTimeout = 60_000;

    socketIO.attach(server, {
      cors: {
        origin,
        methods: ["GET", "POST"],
      },
    });
  } catch (err) {
    console.error("Error during Data Source initialization", err);
    process.exit(1);
  }
}

export { init, DEFAULT_ORIGIN };
