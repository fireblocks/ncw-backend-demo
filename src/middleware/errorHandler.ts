import { ErrorRequestHandler } from "express";
import { UnauthorizedError } from "express-oauth2-jwt-bearer";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (!(error instanceof UnauthorizedError)) {
    console.error(error);
  }

  if (res.headersSent) {
    return next(error);
  }

  res
    .status(error.statusCode ?? 500)
    .json({ error: error?.message ?? "Internal server error" });
};
