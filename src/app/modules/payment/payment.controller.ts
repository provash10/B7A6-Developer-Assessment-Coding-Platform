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

export const PaymentController = {
	getBkashToken,
};
