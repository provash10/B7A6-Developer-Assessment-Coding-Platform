import type { Request, Response } from "express";
import AppError from "../../utils/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	// console.log(req.user);
	const userId = req.user?.userId as string;
	const result = await UserService.getMyProfile(userId);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User profile retrieved successfully",
		data: result,
	});
});

export const updateMyProfile = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const result = await UserService.updateMyProfile(userId, req.body);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User profile updated successfully",
			data: result,
		});
	},
);

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const result = await UserService.getAllUsers(req.query);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Users list retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

export const updateUserRole = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { role } = req.body;
		const performedBy = req.user?.userId;
		const ipAddress = req.ip;

		const result = await UserService.updateUserRole(
			id as string,
			role,
			performedBy,
			ipAddress,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User role updated successfully",
			data: result,
		});
	},
);

export const uploadProfileImage = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.file) {
			throw new AppError(400, "No file provided. Please upload an image.");
		}

		const userId = req.user?.userId;
		if (!userId) {
			throw new AppError(401, "Unauthorized access. User ID missing.");
		}

		const result = await UserService.uploadProfileImage(
			req.file.buffer,
			userId,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Profile image uploaded successfully",
			data: result,
		});
	},
);

export const uploadResume = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.file) {
			throw new AppError(400, "No file provided. Please upload your resume.");
		}

		const userId = req.user?.userId;
		if (!userId) {
			throw new AppError(401, "Unauthorized access. User ID missing.");
		}

		const result = await UserService.uploadResume(req.file.buffer, userId);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Resume uploaded successfully",
			data: result,
		});
	},
);

export const uploadCompanyLogo = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.file) {
			throw new AppError(400, "No file provided. Please upload company logo.");
		}

		const userId = req.user?.userId;
		if (!userId) {
			throw new AppError(401, "Unauthorized access. User ID missing.");
		}

		const result = await UserService.uploadCompanyLogo(
			req.file.buffer,
			userId,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Company logo uploaded successfully",
			data: result,
		});
	},
);

export const UserController = {
	getMyProfile,
	updateMyProfile,
	getAllUsers,
	updateUserRole,
	uploadProfileImage,
	uploadResume,
	uploadCompanyLogo,
};
