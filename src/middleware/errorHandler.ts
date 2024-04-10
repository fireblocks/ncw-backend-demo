import { ErrorRequestHandler } from "express";

import axios from "axios";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.error("error handling request", error);

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
  } else {
    res
      .status(error.statusCode ?? error.status ?? 500)
      .json({ error: error.message ?? "Internal server error" });
  }
};
