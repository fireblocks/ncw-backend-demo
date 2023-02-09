import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { AssetController } from "../controllers/asset.controller";
import { AssetService } from "../services/asset.service";

export function createAssetRoute(clients: Clients) {
  const route = Router({ mergeParams: true });
  const service = new AssetService(clients);
  const controller = new AssetController(service);

  route.get("/", controller.findAll.bind(controller));
  route.post("/:assetId", controller.addAsset.bind(controller));
  route.get("/:assetId", controller.findOne.bind(controller));
  route.get("/:assetId/balance", controller.getBalance.bind(controller));
  route.get("/:assetId/address", controller.getAddress.bind(controller));
  return route;
}
