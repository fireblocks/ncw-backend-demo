import { Request, Handler, Response, NextFunction } from "express";
import { Wallet } from "../model/wallet";

export const validateWallet: Handler = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { auth, params } = req;
  const { walletId } = params;

  try {
    const { sub } = auth!.payload;
    const wallet = await Wallet.findOneOrFail({
      where: {
        devices: {
          wallet: {
            id: walletId,
          },
          user: { sub },
        },
      },
      relations: { devices: { user: true } },
    });

    req.wallet = wallet;
  } catch (e) {
    next(e);
    return;
  }

  next();
};
