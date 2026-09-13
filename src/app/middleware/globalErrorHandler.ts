import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import config from "../config";

const globalErrorHandler: ErrorRequestHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const statusCode = err.statusCode || 500;
	const message = err.message || "Something went wrong!";
	const errorDetails = err;

	res.status(statusCode).json({
		success: false,
		message,
		errorDetails,
		stack: config.env === "development" ? err.stack : undefined,
	});
};

export default globalErrorHandler;
