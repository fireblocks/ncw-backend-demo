import morgan from "morgan";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import { AuthOptions, checkJwt } from "./middleware/jwt";
import { createDeviceRoute } from "./routes/device.route";
import { createWebhook } from "./routes/webhook.route";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";
import { Clients } from "./interfaces/Clients";
import { errorHandler } from "./middleware/errorHandler";
import { createPassphraseRoute } from "./routes/passphrase.route";
import { createWalletRoute } from "./routes/wallet.route";
import { Server as SocketIOServer } from "socket.io";
import { Device } from "./model/device";
import { jwtVerify } from "jose";
import { RpcResponse } from "./interfaces/RpcResponse";
import { PollingService } from "./services/polling.service";

const logger = morgan("combined");

const visibilityTimeout = 120_000;
const waitForTransactionTimeout = 10_000;

function createApp(
  authOpts: AuthOptions,
  clients: Clients,
  webhookPublicKey: string,
  origin: string[],
  enablePolling: boolean,
): { app: express.Express; socketIO: SocketIOServer } {
  const validateUser = checkJwt(authOpts);
  const walletRoute = createWalletRoute(clients);
  const { route: deviceRoute, service: deviceService } =
    createDeviceRoute(clients);
  const passphraseRoute = createPassphraseRoute();
  const webhookRoute = createWebhook(clients, webhookPublicKey);
  const userController = new UserController(new UserService());

  const pollingService = PollingService.createInstance(clients);
  console.log(`Polling ${enablePolling ? "enabled" : "disabled"}`);
  if (enablePolling) {
    pollingService.start();
  }

  const app: Express = express();

  app.use(logger);

  app.use(
    cors({
      origin,
      maxAge: 600,
    }),
  );

  app.use(bodyParser.json({ limit: "50mb" }));

  app.get("/", (req: Request, res: Response) => res.send("OK"));

  app.post(
    "/api/login",
    validateUser,
    userController.login.bind(userController),
  );
  app.use("/api/passphrase", validateUser, passphraseRoute);
  app.use("/api/devices", validateUser, deviceRoute);
  app.use("/api/wallets", validateUser, walletRoute);
  app.use("/api/webhook", webhookRoute);

  app.use(errorHandler);

  const socketIO = new SocketIOServer();

  socketIO.on("connection", async (socket) => {
    const token = socket.handshake?.auth?.token;
    const { verify, key } = authOpts;

    try {
      if (!token) {
        throw new Error("no token provided");
      }

      const payload = await jwtVerify(token, key, verify);
      socket.handshake.auth.payload = payload;
    } catch (e) {
      console.error("failed authenticating socket", e);
      socket.disconnect(true);
      return;
    }

    socket.on(
      "rpc",
      async (
        deviceId: string,
        message: string,
        cb: (response: RpcResponse) => void,
      ) => {
        const { payload } = socket.handshake.auth;
        const device = await Device.findOne({
          where: { id: deviceId, user: { sub: payload.sub } },
        });
        if (!device) {
          cb({ error: { message: "Device not found" } });
          return;
        }

        try {
          const response = await deviceService.rpc(
            device.walletId,
            deviceId,
            message,
          );
          cb({ response });
          return;
        } catch (e) {
          console.error("failed invoking RPC", e);
          cb({
            error: {
              message: "Failed invoking RPC",
              code: -1,
            },
          });
          return;
        }
      },
    );
  });

  return { app, socketIO };
}

export { createApp, visibilityTimeout, waitForTransactionTimeout };
