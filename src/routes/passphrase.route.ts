import { Router } from "express";
import { PassphraseService } from "../services/passphrase.service";
import { PassphraseController } from "../controllers/passphrase.controller";

export function createPassphraseRoute() {
  const service = new PassphraseService();
  const controller = new PassphraseController(service);
  const route = Router({ mergeParams: true });

  route.get("/", controller.findAll.bind(controller));
  route.post("/:passphraseId", controller.create.bind(controller));
  route.get("/:passphraseId", controller.findOne.bind(controller));

  return route;
}
