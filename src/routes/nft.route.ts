import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { NFTController } from "../controllers/nft.controller";
import { NFTService } from "../services/nft.service";

export function createNFTRoutes(clients: Clients) {
  const walletNFTRoute = Router({ mergeParams: true });
  const accountNFTRoute = Router({ mergeParams: true });

  const service = new NFTService(clients);
  const controller = new NFTController(service);

  // requires walletId and accountId
  accountNFTRoute.get(
    "/ownership/tokens",
    controller.getOwnedNFTs.bind(controller),
  );

  // requires walletId
  walletNFTRoute.get(
    "/ownership/collections",
    controller.listOwnedCollections.bind(controller),
  );
  walletNFTRoute.get(
    "/ownership/assets",
    controller.listOwnedAssets.bind(controller),
  );

  return { walletNFTRoute, accountNFTRoute };
}
