import { Prisma } from "@prisma/client";
import type {
	ErrorRequestHandler,
	NextFunction,
	Request,
	Response,
} from "express";
import { ZodError } from "zod";
import config from "../config";
import AppError from "../utils/AppError";

export type TErrorSources = {
	path: string | number;
	message: string;
}[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const globalErrorHandler: ErrorRequestHandler = (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	if (config.env === "development") {
		// console.log("Error from Global Error Handler", err);
	}

	let statusCode = 500;
	let message = "Something went wrong!";
	// let errorDetails = err.stack
	let errorSources: TErrorSources = [
		{
			path: "",
			message: "Something went wrong",
		},
	];

	if (err instanceof ZodError) {
		statusCode = 400;
		message = "Validation Error";
		errorSources = err.issues.map((issue) => ({
			path: issue.path.length ? String(issue.path[issue.path.length - 1]) : "",
			message: issue.message,
		}));
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		statusCode = 400;
		if (err.code === "P2002") {
			message = "Duplicate record already exists";
			errorSources = [
				{
					path: err.meta?.target ? String(err.meta.target) : "",
					message: "A record with this field already exists.",
				},
			];
		} else if (err.code === "P2003") {
			message = "Foreign key constraint failed";
			errorSources = [
				{
					path: "",
					message: "Referenced foreign entity does not exist.",
				},
			];
		} else if (err.code === "P2025") {
			message = "Record not found";
			errorSources = [
				{
					path: "",
					message: "The requested record was not found.",
				},
			];
		} else {
			message = err.message;
		}
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = 400;
		message = "Prisma Client Validation Error";
		errorSources = [
			{
				path: "",
				message: "Incorrect field types or missing required fields.",
			},
		];
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		errorSources = [
			{
				path: "",
				message: err.message,
			},
		];
	} else if (err instanceof Error) {
		message = err.message;
		errorSources = [
			{
				path: "",
				message: err.message,
			},
		];
	}

	res.status(statusCode).json({
		success: false,
		statusCode,
		message,
		errorSources,
		stack: config.env === "development" ? err?.stack : undefined,
	});
};

export default globalErrorHandler;
