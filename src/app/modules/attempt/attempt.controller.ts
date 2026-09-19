import type { Request, Response } from "express";
import type { UserRole } from "@prisma/client";
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

export const recordAntiCheatFlag = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const { id } = req.params;

		const result = await AttemptService.recordAntiCheatFlag(
			id as string,
			userId,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Anti-cheat flag recorded successfully",
			data: result,
		});
	},
);

export const finishAttempt = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const { id } = req.params;

	const result = await AttemptService.finishAttempt(id as string, userId);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Assessment attempt finalized and submitted successfully",
		data: result,
	});
});

export const getAttemptResult = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as UserRole;
		const { id } = req.params;

		const result = await AttemptService.getAttemptResult(
			id as string,
			userId,
			userRole,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment attempt results retrieved successfully",
			data: result,
		});
	},
);

export const getMyAttempts = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const result = await AttemptService.getMyAttempts(userId, req.query);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "My assessment attempts retrieved successfully",
		data: result,
	});
});

export const AttemptController = {
	startAttempt,
	getAttemptQuestions,
	submitAnswer,
	recordAntiCheatFlag,
	finishAttempt,
	getAttemptResult,
	getMyAttempts,
};
