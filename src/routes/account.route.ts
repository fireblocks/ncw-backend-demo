import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { createAssetRoute } from "./asset.route";
import { AccountContoller } from "../controllers/account.contoller";

export function createAccountsRoute(clients: Clients, nftRoute: Router) {
  const assets = createAssetRoute(clients);
  const controller = new AccountContoller(clients);

  const route = Router({ mergeParams: true });
  route.get("/", controller.findAll.bind(controller));
  route.use("/:accountId/assets/", assets);
  route.use("/:accountId/nfts/", nftRoute);

  return route;
}
