import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
	IForgotPasswordInput,
	IGoogleLoginInput,
	ILoginUserInput,
	IRegisterUserInput,
	IResetPasswordInput,
} from "./auth.interface";

export const registerUser = async (payload: IRegisterUserInput) => {
	const existingUser = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (existingUser) {
		throw new AppError(400, "User with this email already exists.");
	}

	const passwordHash = await bcrypt.hash(payload.password, 10);
	const userRole = payload.role || "CANDIDATE";

	const result = await prisma.$transaction(async (tx) => {
		const newUser = await tx.user.create({
			data: {
				email: payload.email,
				passwordHash,
				name: payload.name,
				phone: payload.phone,
				role: userRole,
			},
		});

		if (userRole === "RECRUITER") {
			await tx.recruiterProfile.create({
				data: {
					userId: newUser.id,
					companyName: payload.companyName || null,
					companyWebsite: payload.companyWebsite || null,
				},
			});
		} else if (userRole === "CANDIDATE") {
			await tx.candidateProfile.create({
				data: {
					userId: newUser.id,
					skills: payload.skills || [],
					experienceYears: payload.experienceYears || 0,
				},
			});
		}

		return newUser;
	});

	// Send welcome email (optional/non-blocking)
	sendEmail({
		to: result.email,
		subject: "Welcome to Developer Assessment Platform",
		templateName: "registration-user-otp",
		templateData: {
			name: result.name,
			email: result.email,
			otp: "VERIFIED",
			expirationMinutes: 10,
		},
	}).catch((err) => {
		// console.log("Email sending error:", err);
	});

	const accessToken = jwt.sign(
		{
			id: result.id,
			userId: result.id,
			name: result.name,
			email: result.email,
			role: result.role,
		},
		config.jwt.jwt_secret as string,
		{
			expiresIn: config.jwt.expires_in as any,
		},
	);

	const refreshToken = jwt.sign(
		{
			id: result.id,
			userId: result.id,
			name: result.name,
			email: result.email,
			role: result.role,
		},
		config.jwt.refresh_token_secret as string,
		{
			expiresIn: config.jwt.refresh_token_expires_in as any,
		},
	);

	return {
		user: {
			id: result.id,
			email: result.email,
			name: result.name,
			role: result.role,
		},
		accessToken,
		refreshToken,
	};
};

export const loginUser = async (payload: ILoginUserInput) => {
	const user = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (!user || user.deletedAt) {
		throw new AppError(401, "Invalid email or password.");
	}

	const isPasswordMatch = await bcrypt.compare(
		payload.password,
		user.passwordHash,
	);

	if (!isPasswordMatch) {
		throw new AppError(401, "Invalid email or password.");
	}

	const accessToken = jwt.sign(
		{
			id: user.id,
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
		config.jwt.jwt_secret as string,
		{
			expiresIn: config.jwt.expires_in as any,
		},
	);

	const refreshToken = jwt.sign(
		{
			id: user.id,
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
		config.jwt.refresh_token_secret as string,
		{
			expiresIn: config.jwt.refresh_token_expires_in as any,
		},
	);

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		},
		accessToken,
		refreshToken,
	};
};

export const forgotPassword = async (payload: IForgotPasswordInput) => {
	const user = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (!user || user.deletedAt) {
		throw new AppError(404, "User with this email was not found.");
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();

	await sendEmail({
		to: user.email,
		subject: "Password Reset OTP Code",
		templateName: "forgot-password",
		templateData: {
			name: user.name,
			otp,
			expirationMinutes: 10,
		},
	});

	return { message: "Password reset OTP has been sent to your email.", otp };
};

export const resetPassword = async (payload: IResetPasswordInput) => {
	const user = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (!user || user.deletedAt) {
		throw new AppError(404, "User not found.");
	}

	const newPasswordHash = await bcrypt.hash(payload.newPassword, 10);

	await prisma.user.update({
		where: { id: user.id },
		data: { passwordHash: newPasswordHash },
	});

	sendEmail({
		to: user.email,
		subject: "Password Reset Successful",
		templateName: "reset-password-success",
		templateData: { name: user.name },
	}).catch((err) => {
		// console.log("Email error:", err);
	});

	return { message: "Password reset completed successfully." };
};

export const googleLogin = async (payload: IGoogleLoginInput) => {
	const ticket = await googleClient.verifyIdToken({
		idToken: payload.idToken,
		audience: config.google_client_id,
	});

	const googlePayload = ticket.getPayload();
	if (!googlePayload || !googlePayload.email) {
		throw new AppError(400, "Google authentication failed.");
	}

	let user = await prisma.user.findUnique({
		where: { email: googlePayload.email },
	});

	if (!user) {
		const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
		user = await prisma.user.create({
			data: {
				email: googlePayload.email,
				name: googlePayload.name || "Google User",
				passwordHash: randomPassword,
				role: "CANDIDATE",
				candidateProfile: {
					create: {
						skills: [],
					},
				},
			},
		});
	}

	const accessToken = jwt.sign(
		{
			id: user.id,
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
		config.jwt.jwt_secret as string,
		{
			expiresIn: config.jwt.expires_in as any,
		},
	);

	const refreshToken = jwt.sign(
		{
			id: user.id,
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
		config.jwt.refresh_token_secret as string,
		{
			expiresIn: config.jwt.refresh_token_expires_in as any,
		},
	);

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		},
		accessToken,
		refreshToken,
	};
};

export const AuthService = {
	registerUser,
	loginUser,
	forgotPassword,
	resetPassword,
	googleLogin,
};
