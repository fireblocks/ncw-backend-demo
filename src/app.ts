import morgan from "morgan";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";

import { AuthOptions } from "express-oauth2-jwt-bearer";
import { checkJwt } from "./middleware/jwt";
import { createDeviceRoute } from "./routes/device.route";
import { createWebhook } from "./routes/webhook.route";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";
import { Clients } from "./interfaces/Clients";
import { errorHandler } from "./middleware/errorHandler";

const logger = morgan("combined");

export const visibilityTimeout = 120_000;
export const waitForTransactionTimeout = 10_000;

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

function createApp(
  authOpts: AuthOptions,
  clients: Clients,
  webhookPublicKey: string,
): express.Express {
  const validateUser = checkJwt(authOpts);
  const deviceRoute = createDeviceRoute(clients);
  const webhookRoute = createWebhook(clients, webhookPublicKey);
  const userContoller = new UserController(new UserService());

  const app: Express = express();

  app.use(logger);

  app.use(
    cors({
      origin: getOriginFromEnv(),
      maxAge: 600,
    }),
  );

  app.use(bodyParser.json({ limit: "50mb" }));

  app.get("/", (req: Request, res: Response) => res.send("OK"));

  app.post("/api/login", validateUser, userContoller.login.bind(userContoller));
  app.use("/api/devices", validateUser, deviceRoute);
  app.use("/api/webhook", webhookRoute);

  app.use(errorHandler);

  return app;
}

export { createApp };
