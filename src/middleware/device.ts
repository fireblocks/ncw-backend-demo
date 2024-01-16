import { Request, Handler, Response, NextFunction } from "express";
import { Device } from "../model/device";

export const validateDevice: Handler = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { auth, params } = req;
  const { deviceId } = params;

  try {
    const { sub } = auth!.payload;
    const device = await Device.findOneOrFail({
      where: {
        id: deviceId,
        user: { sub },
      },
      relations: { user: true },
    });

    req.device = device;
  } catch (e) {
    next(e);
    return;
  }

  next();
};
