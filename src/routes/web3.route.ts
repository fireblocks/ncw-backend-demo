import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { Web3Service } from "../services/web3.service";
import { Web3Controller } from "../controllers/web3.controller";

export function createWeb3Route({ signer }: Clients) {
  const route = Router({ mergeParams: true });
  const service = new Web3Service(signer);
  const controller = new Web3Controller(service);

  route.get("/connections/", controller.find.bind(controller));
  route.post("/connections/", controller.create.bind(controller));
  route.post(
    "/connections/:sessionId/approve",
    controller.approve.bind(controller),
  );
  route.post("/connections/:sessionId/deny", controller.deny.bind(controller));
  route.delete("/connections/:sessionId", controller.remove.bind(controller));

  return route;
}
