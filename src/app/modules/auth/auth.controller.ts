import type { Request, Response } from "express";
import AppError from "../../utils/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerUser(req.body);
	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24,
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "User registered successfully",
		data: result,
	});
});

export const login = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await AuthService.loginUser(payload);
	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24,
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User logged in successfully",
		data: {
			accessToken,
			refreshToken,
			user: result.user,
		},
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
	const payload = req.body;
	const result = await AuthService.googleLogin(payload);
	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24,
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Google login successful",
		data: {
			accessToken,
			refreshToken,
			user,
		},
	});
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
	const token = req.cookies?.refreshToken || req.body?.refreshToken;

	if (!token) {
		throw new AppError(401, "Refresh token is missing.");
	}

	const result = await AuthService.refreshToken(token);

	res.cookie("refreshToken", result.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "New access token generated successfully",
		data: result,
	});
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	});
	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User logged out successfully",
		data: null,
	});
});

export const changePassword = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const result = await AuthService.changePassword(userId, req.body);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: null,
		});
	},
);

export const AuthController = {
	register,
	login,
	forgotPassword,
	resetPassword,
	googleLogin,
	refreshToken,
	logout,
	changePassword,
};
