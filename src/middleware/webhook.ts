import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export const validateWebhook =
  (publicKey: string) => (req: Request, res: Response, next: NextFunction) => {
    // TODO: disabled in devx, remove before flight and check in prod or find devx push-api key
    if (true === true) {
      next();
      return;
    }

    const message = JSON.stringify(req.body);
    const signature = req.headers["fireblocks-signature"];

    if (typeof signature !== "string") {
      next(new Error(`Invalid signature`));
      return;
    }

    const verifier = crypto.createVerify("RSA-SHA512");
    verifier.write(message);
    verifier.end();

    const isVerified = verifier.verify(publicKey, signature, "base64");
    if (isVerified) {
      next();
    } else {
      next(new Error(`Invalid signature`));
    }
  };
