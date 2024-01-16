import { Request, NextFunction, Response } from "express";
import { PassphraseService } from "../services/passphrase.service";
import { PassphraseLocation } from "../model/passphrase";

export class PassphraseController {
  constructor(private readonly service: PassphraseService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    const { auth, params } = req;
    const { passphraseId } = params;
    const { sub } = auth!.payload;
    const { location } = req.body;

    try {
      if (typeof location !== "string" || !(location in PassphraseLocation)) {
        return res.status(400).send("Invalid location");
      }

      await this.service.create(
        sub!,
        passphraseId,
        location as PassphraseLocation,
      );
      res.json({ passphraseId });
    } catch (err) {
      next(err);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    const { auth, params } = req;
    const { passphraseId } = params;
    const { sub } = auth!.payload;

    try {
      const passphrase = await this.service.findOne(sub!, passphraseId);
      if (!passphrase) {
        return res.status(404).send("Not found");
      }
      res.json({
        location: passphrase.location,
      });
    } catch (err) {
      next(err);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    const { auth } = req;
    const { sub } = auth!.payload;

    try {
      const passphrases = await this.service.findAll(sub!);
      res.json({
        passphrases: passphrases.map(({ id, createdAt, location }) => ({
          passphraseId: id,
          location,
          createdAt: createdAt.valueOf(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
}
