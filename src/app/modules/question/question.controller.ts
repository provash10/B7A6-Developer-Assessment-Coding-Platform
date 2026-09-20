import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { QuestionService } from "./question.service";

export const createQuestion = catchAsync(
	async (req: Request, res: Response) => {
		// console.log("creating question with payload:", req.body);
		const result = await QuestionService.createQuestion(req.body);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Question created successfully",
			data: result,
		});
	},
);

export const getAllQuestions = catchAsync(
	async (req: Request, res: Response) => {
		// console.log("fetching questions with query params:", req.query);
		const result = await QuestionService.getAllQuestions(req.query);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Questions retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getQuestionById = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		// console.log("fetching question with id:", id);
		const result = await QuestionService.getQuestionById(id as string);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Question retrieved successfully",
			data: result,
		});
	},
);

export const updateQuestion = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		// console.log("updating question id:", id, "payload:", req.body);
		const result = await QuestionService.updateQuestion(id as string, req.body);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Question updated successfully",
			data: result,
		});
	},
);

export const deleteQuestion = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		// console.log("deleting question with id:", id);
		const result = await QuestionService.deleteQuestion(id as string);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Question deleted successfully",
			data: result,
		});
	},
);

export const QuestionController = {
	createQuestion,
	getAllQuestions,
	getQuestionById,
	updateQuestion,
	deleteQuestion,
};
