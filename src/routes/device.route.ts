import { Router } from "express";
import { validateDevice } from "../middleware/device";
import { DeviceController } from "../controllers/device.controller";
import { Clients } from "../interfaces/Clients";
import { createAccountsRoute } from "./account.route";
import { createMessageRoute } from "./message.route";
import { createTransactionRoute } from "./transaction.route";
import { DeviceService } from "../services/device.service";
import { createWeb3Route } from "./web3.route";
import compression from "compression";
import { createNFTRoutes } from "./nft.route";

export function createDeviceRoute(clients: Clients) {
  const transactionsRoute = createTransactionRoute(clients);
  const messagesRoute = createMessageRoute();
  const { walletNFTRoute, accountNFTRoute } = createNFTRoutes(clients);
  const accountsRoute = createAccountsRoute(clients, accountNFTRoute);
  const web3Route = createWeb3Route(clients);

  const service = new DeviceService(clients);
  const controller = new DeviceController(service);
  const route = Router({ mergeParams: true });

  // note: no validateDevice during wallet assignment
  route.post("/:deviceId/assign", controller.assign.bind(controller));
  route.post("/:deviceId/join", controller.join.bind(controller));
  route.get("/", controller.findAll.bind(controller));

  route.use("/:deviceId", validateDevice);
  route.use("/:deviceId/transactions", transactionsRoute);
  route.use("/:deviceId/accounts", accountsRoute);
  route.use("/:deviceId/nfts", walletNFTRoute);
  route.use("/:deviceId/messages", messagesRoute);
  route.use("/:deviceId/web3", web3Route);
  route.post("/:deviceId/rpc", compression(), controller.rpc.bind(controller));

  return { route, service };
}
