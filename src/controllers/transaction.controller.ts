import { NextFunction, Response } from "express";
import {
  FeeLevel,
  PeerType,
  TransactionArguments,
  TransactionStatus,
} from "fireblocks-sdk";
import { RequestEx } from "../interfaces/requestEx";
import { waitForTransactionTimeout } from "../app";
import { TransactionSubscriber } from "../subscribers/transaction.subscriber";
import { TransactionService } from "../services/transaction.service";
import { FindOptionsOrderValue } from "typeorm";
import {
  buildOnetimeAddressTransferArgs,
  buildAccountTransferArgs,
  buildTestTypedDataArgs,
} from "../util/transactionBuilder";

export class TransactionController {
  constructor(
    private readonly service: TransactionService,
    private readonly txSubscriber: TransactionSubscriber,
  ) {}

  async cancel(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { txId } = params;

    try {
      const { walletId } = device!;
      const transaction = await this.service.findOne(txId, walletId);
      if (!transaction) {
        return res.status(404).json();
      }

      const { success } = await this.service.cancel(walletId, txId);
      return res.json({ success });
    } catch (err) {
      return next(err);
    }
  }

  async findOne(req: RequestEx, res: Response, next: NextFunction) {
    const { device, params } = req;
    const { txId } = params;

    try {
      const { walletId } = device!;
      const transaction = await this.service.findOne(txId, walletId);

      if (!transaction) {
        return res.status(404).json();
      }

      return res.json(transaction);
    } catch (err) {
      return next(err);
    }
  }

  async create(req: RequestEx, res: Response, next: NextFunction) {
    const { device, body } = req;
    const {
      assetId = "ETH_TEST3",
      accountId = "0",
      note = `API Transaction by ${req.auth?.payload.sub}`,
      destAddress = undefined,
      destAccount = undefined,
      amount = "0.00001",
      feeLevel = FeeLevel.MEDIUM,
      gasLimit = undefined,
      estimateFee = false,
    } = body;

    try {
      const { walletId } = device!;

      const base: TransactionArguments = {
        source: {
          type: PeerType.END_USER_WALLET,
          walletId,
          id: accountId,
        },
        assetId,
        note,
      };

      let args: TransactionArguments;

      if (destAddress) {
        args = buildOnetimeAddressTransferArgs(
          destAddress,
          amount,
          feeLevel,
          gasLimit,
        );
      } else if (destAccount) {
        args = buildAccountTransferArgs(
          walletId,
          destAccount,
          amount,
          feeLevel,
          gasLimit,
        );
      } else {
        args = buildTestTypedDataArgs();
      }

      if (estimateFee) {
        const { low, medium, high } = await this.service.estimate(walletId, {
          ...base,
          ...args,
        });
        res.json({ fee: { low, medium, high } });
      } else {
        const { id, status } = await this.service.create(walletId, {
          ...base,
          ...args,
        });
        res.json({ id, status });
      }
    } catch (err) {
      return next(err);
    }
  }

  async find(req: RequestEx, res: Response, next: NextFunction) {
    const { query, device } = req;

    const startDate: Date = query.startDate
      ? new Date(Number(query.startDate))
      : new Date(0);
    const endDate: Date = query.endDate
      ? new Date(Number(query.endDate))
      : new Date();
    const statuses = query.status
      ? Array.isArray(query.status)
        ? (query.status as TransactionStatus[])
        : [query.status as TransactionStatus]
      : undefined;
    const skip = query.skip ? Number(query.take) : 0;
    const take = query.take ? Number(query.take) : 25;
    const poll = query.poll ? Boolean(query.poll) : false;
    const details = query.details ? Boolean(query.details) : false;
    const orderBy = query.orderBy ? String(query.orderBy) : "lastUpdated";
    const dir = query.dir ? String(query.dir).toUpperCase() : "DESC";

    if (take < 0 || /* TODO: take > 100 || */ !Number.isInteger(take)) {
      return res.status(400).send("Invalid take value");
    }

    if (skip < 0 || !Number.isInteger(skip)) {
      return res.status(400).send("Invalid skip value");
    }

    if (
      statuses &&
      !statuses.every((s) => Object.values(TransactionStatus).includes(s))
    ) {
      return res.status(400).send("Invalid status value");
    }

    if (!["DESC", "ASC"].includes(dir)) {
      return res.status(400).send("Invalid dir value");
    }

    if (!["lastUpdated", "createdAt"].includes(orderBy)) {
      return res.status(400).send("Invalid orderBy value");
    }

    try {
      const { walletId } = device!;

      let transactions = await this.service.find(
        walletId,
        orderBy as "lastUpdated" | "createdAt",
        startDate,
        endDate,
        statuses,
        dir as FindOptionsOrderValue,
        skip,
        take,
      );

      if (!transactions.length && poll) {
        transactions = await this.txSubscriber.waitForTransactions(
          walletId,
          waitForTransactionTimeout,
          statuses,
        );
      }

      return res.json(
        transactions.map(
          ({ id, status, createdAt, lastUpdated, details: dets }) => ({
            id,
            status,
            createdAt: createdAt.valueOf(),
            lastUpdated: lastUpdated.valueOf(),
            details: details ? dets : undefined,
          }),
        ),
      );
    } catch (err) {
      return next(err);
    }
  }
}
