import { NextFunction, Response } from "express";
import { RequestEx } from "../interfaces/requestEx";
import { getMessages, deleteMessage } from "../services/message.service";

export class MessageController {
  async findMany(req: RequestEx, res: Response, next: NextFunction) {
    const physicalDeviceId = req.query.physicalDeviceId;
    const timeout = Number(req.query.timeout ?? 10);
    const batchSize = Number(req.query.batchSize ?? 10);

    if (timeout < 0 || timeout > 20 || !Number.isInteger(timeout)) {
      return res.status(400).send("Invalid timeout value");
    }

    if (batchSize < 1 || batchSize > 20 || !Number.isInteger(batchSize)) {
      return res.status(400).send("Invalid batchSize value");
    }

    if (
      physicalDeviceId !== undefined &&
      typeof physicalDeviceId !== "string"
    ) {
      return res.status(400).send("Invalid physicalDeviceId value");
    }

    try {
      const messages = await getMessages(
        req.device!.id,
        req.auth!.payload.sub!,
        batchSize,
        physicalDeviceId,
        timeout,
      );

      return res.json(messages.map(({ id, message }) => ({ id, message })));
    } catch (err) {
      return next(err);
    }
  }

  async deleteOne(req: RequestEx, res: Response, next: NextFunction) {
    const { auth, params, device } = req;
    const { messageId } = params;

    try {
      const { sub } = auth!.payload;
      const result = await deleteMessage(messageId, device!.id, sub!);
      if (result.affected) {
        return res.status(200).send();
      } else {
        return res.status(404).send();
      }
    } catch (err) {
      return next(err);
    }
  }
}
