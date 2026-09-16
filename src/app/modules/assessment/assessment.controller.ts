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

export const AssessmentController = {
	createAssessment,
};
