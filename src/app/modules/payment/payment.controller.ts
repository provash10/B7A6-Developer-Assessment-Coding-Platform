import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

export const getBkashToken = catchAsync(
	async (_req: Request, res: Response) => {
		const token = await PaymentService.getBkashToken();

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "bKash access token generated successfully",
			data: {
				id_token: token,
			},
		});
	},
);

export const initiatePayment = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const { credits } = req.body;

		const result = await PaymentService.initiatePayment(
			userId,
			Number(credits),
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "bKash payment initiated successfully",
			data: result,
		});
	},
);

export const handlePaymentCallback = catchAsync(
	async (req: Request, res: Response) => {
		// bkash sends paymentid and status via query params or request body
		const paymentId = (req.query.paymentID || req.body.paymentID) as string;
		const status = (req.query.status || req.body.status) as string;

		const result = await PaymentService.executePayment(paymentId, status);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: result,
		});
	},
);

export const getMyTransactions = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;

		const result = await PaymentService.getMyTransactions(userId, req.query);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "My payment transactions retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getAllTransactions = catchAsync(
	async (req: Request, res: Response) => {
		const result = await PaymentService.getAllTransactions(req.query);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "All payment transactions retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getSingleTransaction = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as string;
		const { id } = req.params;

		const result = await PaymentService.getSingleTransaction(
			id as string,
			userId,
			userRole,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Payment transaction retrieved successfully",
			data: result,
		});
	},
);

export const PaymentController = {
	getBkashToken,
	initiatePayment,
	handlePaymentCallback,
	getMyTransactions,
	getAllTransactions,
	getSingleTransaction,
};
