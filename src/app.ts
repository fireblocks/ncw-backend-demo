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
import { createPassphraseRoute } from "./routes/passphrase.route";
import { createWalletRoute } from "./routes/wallet.route";
import { Server } from "socket.io";
import { Device } from "./model/device";
import serverTiming from "server-timing";
const logger = morgan("combined");

export const visibilityTimeout = 120_000;
export const waitForTransactionTimeout = 10_000;

function createApp(
  authOpts: AuthOptions,
  clients: Clients,
  webhookPublicKey: string,
  origin: string[],
): { app: express.Express; io: Server } {
  const validateUser = checkJwt(authOpts);
  const walletRoute = createWalletRoute(clients);
  const { route: deviceRoute, service: deviceService } =
    createDeviceRoute(clients);
  const passphraseRoute = createPassphraseRoute();
  const webhookRoute = createWebhook(clients, webhookPublicKey);
  const userContoller = new UserController(new UserService());

  const app: Express = express();

  app.use(logger);

  app.use(
    cors({
      origin,
      maxAge: 600,
    }),
  );

  app.use(serverTiming());

  app.use(bodyParser.json({ limit: "50mb" }));

  app.get("/", (req: Request, res: Response) => res.send("OK"));

  app.use((_req, res, next) => {
    res.startTime("api", "api request");
    next();
  });
  app.post("/api/login", validateUser, userContoller.login.bind(userContoller));
  app.use("/api/passphrase", validateUser, passphraseRoute);
  app.use("/api/devices", validateUser, deviceRoute);
  app.use("/api/wallets", validateUser, walletRoute);
  app.use("/api/webhook", webhookRoute);
  app.use((_req, res, next) => {
    res.endTime("api");
    next();
  });

  app.use(errorHandler);

  const io = new Server();

  io.on("connection", (socket) => {
    // TODO:
    socket.on("login", () => {});

    socket.on("rpc", async (deviceId: string, message: string, cb) => {
      // TODO:
      // console.log("received rpc", deviceId, message);

      const start = Date.now();
      const device = await Device.findOne({ where: { id: deviceId } });
      if (!device) {
        return;
      }

      const response = await deviceService.rpc(
        device.walletId,
        deviceId,
        message,
      );
      console.log(`rpc: calling back ${deviceId}`, Date.now() - start);
      await cb(response);
      console.log(`rpc: total ${deviceId}`, Date.now() - start);
    });
  });

  return { app, io };
}

export { createApp };
