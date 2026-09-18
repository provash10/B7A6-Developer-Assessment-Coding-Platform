import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AttemptService } from "./attempt.service";

export const startAttempt = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const { id } = req.params;

	const result = await AttemptService.startAttempt(id as string, userId);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Assessment attempt started successfully",
		data: result,
	});
});

export const getAttemptQuestions = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const { id } = req.params;

		const result = await AttemptService.getAttemptQuestions(
			id as string,
			userId,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Exam questions retrieved successfully",
			data: result,
		});
	},
);

export const submitAnswer = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const { id } = req.params;

	const result = await AttemptService.submitAnswer(
		id as string,
		userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Answer submitted and evaluated successfully",
		data: result,
	});
});

export const AttemptController = {
	startAttempt,
	getAttemptQuestions,
	submitAnswer,
};
