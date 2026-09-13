import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const result = await UserService.getMyProfile(userId);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User profile retrieved successfully",
		data: result,
	});
});

export const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	const result = await UserService.updateMyProfile(userId, req.body);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User profile updated successfully",
		data: result,
	});
});

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

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const { role } = req.body;
	const result = await UserService.updateUserRole(id as string, role);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User role updated successfully",
		data: result,
	});
});

export const UserController = {
	getMyProfile,
	updateMyProfile,
	getAllUsers,
	updateUserRole,
};
