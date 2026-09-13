import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

export const validateRequest = (zodSchema: ZodTypeAny) => {
	return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
		// const payload = req.body ? req.body : {}
		const payload = req.body ?? {};

		const result = await zodSchema.safeParseAsync(payload);

		if (!result.success) {
			console.log(result.error);
			console.log(result.error.issues);

			throw new AppError(400, result.error.issues[0]?.message || "Validation Error");
		}

		req.body = result.data;

		next();
	});
};

export default validateRequest;
