import type { Response } from "express";

export type TMeta = {
	page: number;
	limit: number;
	total: number;
	totalPages?: number;
};

export type TResponse<T> = {
	statusCode: number;
	success: boolean;
	message?: string;
	meta?: TMeta;
	data?: T | null;
};

export const sendResponse = <T>(res: Response, data: TResponse<T>) => {
	res.status(data.statusCode).json({
		success: data.success,
		statusCode: data.statusCode,
		message: data.message || "Operation successful",
		meta: data.meta || undefined,
		data: data.data || null,
	});
};

export default sendResponse;
