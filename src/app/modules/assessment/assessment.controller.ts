import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AssessmentService } from "./assessment.service";

export const createAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		// console.log("controller creating assessment for user:", userid);
		const result = await AssessmentService.createAssessment(userId, req.body);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Assessment draft created successfully",
			data: result,
		});
	},
);

export const getAllAssessments = catchAsync(
	async (req: Request, res: Response) => {
		// console.log("controller fetching assessments with query:", req.query);
		const result = await AssessmentService.getAllAssessments(req.query);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessments retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getSingleAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		// console.log("controller fetching assessment with id:", id);
		const result = await AssessmentService.getAssessmentById(id as string);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment retrieved successfully",
			data: result,
		});
	},
);

export const updateAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		// console.log("controller updating assessment id:", id, "payload:", req.body);
		const result = await AssessmentService.updateAssessment(
			id as string,
			req.body,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment updated successfully",
			data: result,
		});
	},
);

export const addQuestionToAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		// console.log("controller adding question to assessment id:", id);
		const result = await AssessmentService.addQuestionToAssessment(
			id as string,
			req.body,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Question added to assessment successfully",
			data: result,
		});
	},
);

export const removeQuestionFromAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const { id, questionId } = req.params;
		// console.log("controller removing question:", questionid, "from assessment:", id);
		const result = await AssessmentService.removeQuestionFromAssessment(
			id as string,
			questionId as string,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Question removed from assessment successfully",
			data: result,
		});
	},
);

export const deleteAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const deletedBy = req.user?.userId;
		const ipAddress = req.ip;
		// console.log("controller deleting assessment id:", id);
		const result = await AssessmentService.deleteAssessment(
			id as string,
			deletedBy,
			ipAddress,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment deleted successfully",
			data: result,
		});
	},
);

export const getAssessmentLeaderboard = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as string;
		// console.log("controller fetching leaderboard for assessment id:", id);

		const result = await AssessmentService.getAssessmentLeaderboard(
			id as string,
			userId,
			userRole,
			req.query,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment leaderboard retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getAssessmentAnalytics = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as string;
		// console.log("controller fetching analytics for assessment id:", id);

		const result = await AssessmentService.getAssessmentAnalytics(
			id as string,
			userId,
			userRole,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment analytics retrieved successfully",
			data: result,
		});
	},
);

export const AssessmentController = {
	createAssessment,
	getAllAssessments,
	getSingleAssessment,
	updateAssessment,
	addQuestionToAssessment,
	removeQuestionFromAssessment,
	deleteAssessment,
	getAssessmentLeaderboard,
	getAssessmentAnalytics,
};
