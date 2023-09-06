import { ErrorRequestHandler } from "express";
import { UnauthorizedError } from "express-oauth2-jwt-bearer";
import axios from "axios";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (!(error instanceof UnauthorizedError)) {
    console.error(error);
  }

  if (res.headersSent) {
    return next(error);
  }

  if (axios.isAxiosError(error)) {
    res.status(error.status ?? 500).json({ error: error.message });
  } else {
    res
      .status(error.statusCode ?? error.status ?? 500)
      .json({ error: error.message ?? "Internal server error" });
  }
};
