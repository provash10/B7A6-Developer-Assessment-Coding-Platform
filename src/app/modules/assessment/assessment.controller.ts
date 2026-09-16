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

export const AssessmentController = {
	createAssessment,
	getAllAssessments,
	getSingleAssessment,
};
