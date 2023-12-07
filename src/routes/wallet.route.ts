import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { validateWallet } from "../middleware/wallet";
import { WalletService } from "../services/wallet.service";
import { WalletController } from "../controllers/wallet.controller";

export function createWalletRoute(clients: Clients) {
  const service = new WalletService(clients);
  const controller = new WalletController(service);
  const route = Router({ mergeParams: true });

  route.get("/", controller.findAll.bind(controller));
  route.use("/:walletId", validateWallet);
  route.use(
    "/:walletId/backup/latest",
    controller.getLatestBackup.bind(controller),
  );

  return route;
}
