import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import catchAsync from "../utils/catchAsync";

export const validateRequest = (schema: ZodTypeAny) => {
	return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
		const parsed = await schema.parseAsync({
			body: req.body,
			query: req.query,
			params: req.params,
			cookies: req.cookies,
		});

		if (parsed && typeof parsed === "object" && "body" in parsed) {
			req.body = (parsed as { body: unknown }).body;
		}

		next();
	});
};

export default validateRequest;
