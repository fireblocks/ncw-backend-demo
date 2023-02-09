import { Router } from "express";
import { MessageController } from "../controllers/message.controller";

export function createMessageRoute() {
  const route = Router({ mergeParams: true });

  const controller = new MessageController();
  route.get("/", controller.findMany.bind(controller));
  route.delete("/:messageId", controller.deleteOne.bind(controller));

  return route;
}
