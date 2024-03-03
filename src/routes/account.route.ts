import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { createAssetRoute } from "./asset.route";
import { AccountContoller } from "../controllers/account.contoller";
import { createNFTRoute } from "./nft.route";

export function createAccountsRoute(clients: Clients) {
  const assets = createAssetRoute(clients);
  const nftsRoute = createNFTRoute(clients);
  const controller = new AccountContoller(clients);

  const route = Router({ mergeParams: true });
  route.get("/", controller.findAll.bind(controller));
  route.use("/:accountId/assets/", assets);
  route.use("/:accountId/nfts/", nftsRoute);

  return route;
}
