import { Router } from "express";
import { TransactionSubscriber } from "../subscribers/transaction.subscriber";
import { TransactionService } from "../services/transaction.service";
import { TransactionController } from "../controllers/transaction.controller";
import { Clients } from "../interfaces/Clients";

export function createTransactionRoute({ signer }: Clients) {
  const txSubscriber = new TransactionSubscriber();
  const route = Router({ mergeParams: true });
  const service = new TransactionService(signer);
  const controller = new TransactionController(service, txSubscriber);

  route.get("/", controller.find.bind(controller));
  route.post("/", controller.create.bind(controller));
  route.get("/:txId", controller.findOne.bind(controller));
  route.post("/:txId/cancel", controller.cancel.bind(controller));

  return route;
}
