import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import config from "../config";

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong!";
  let errorDetails = err;

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
    stack: config.env === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
