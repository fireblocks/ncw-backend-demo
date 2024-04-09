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
    const errorResponse = error.response?.data ?? {};
    res.status(error.response?.status ?? 500).json({
      error: error.message,
      message: errorResponse.message,
      code: errorResponse.code ?? -1,
    });
  } else if (error instanceof UnauthorizedError) {
    res.status(401).json({ error: error.message });
  } else {
    res
      .status(error.statusCode ?? error.status ?? 500)
      .json({ error: error.message ?? "Internal server error" });
  }
};
