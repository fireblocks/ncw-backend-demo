import { Router } from "express";
import { Clients } from "../interfaces/Clients";
import { validateWebhook } from "../middleware/webhook";
import { WebhookController } from "../controllers/webhook.controller";

export function createWebhook(clients: Clients, publicKey: string) {
  const contoller = new WebhookController(clients);
  const route = Router({ mergeParams: true });
  route.post("/", validateWebhook(publicKey), contoller.handle.bind(contoller));
  return route;
}
