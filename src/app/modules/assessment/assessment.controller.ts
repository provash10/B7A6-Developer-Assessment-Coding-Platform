import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AssessmentService } from "./assessment.service";

export const createAssessment = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		// console.log("Controller creating assessment for user:", userId);
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
		// console.log("Controller fetching assessments with query:", req.query);
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
		// console.log("Controller fetching assessment with ID:", id);
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
		// console.log("Controller updating assessment ID:", id, "payload:", req.body);
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
		// console.log("Controller adding question to assessment ID:", id);
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
		// console.log("Controller removing question:", questionId, "from assessment:", id);
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
		// console.log("Controller deleting assessment ID:", id);
		const result = await AssessmentService.deleteAssessment(id as string);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Assessment deleted successfully",
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
};
