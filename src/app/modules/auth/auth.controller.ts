import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerUser(req.body);

	res.cookie("refreshToken", result.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
	});

	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "User registered successfully",
		data: result,
	});
});

export const login = catchAsync(async (req: Request, res: Response) => {
	// console.log(req.body);
	const result = await AuthService.loginUser(req.body);

	res.cookie("refreshToken", result.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User logged in successfully",
		data: result,
	});
});

export const forgotPassword = catchAsync(
	async (req: Request, res: Response) => {
		const result = await AuthService.forgotPassword(req.body);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: { otp: result.otp },
		});
	},
);

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.resetPassword(req.body);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: result.message,
		data: null,
	});
});

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.googleLogin(req.body);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Google login successful",
		data: result,
	});
});

export const AuthController = {
	register,
	login,
	forgotPassword,
	resetPassword,
	googleLogin,
};
