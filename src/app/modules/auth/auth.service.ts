import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import jwtUtils from "../../utils/jwt";
import type {
	IChangePasswordInput,
	IForgotPasswordInput,
	IGoogleLoginInput,
	ILoginUserInput,
	IRefreshTokenResponse,
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
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(404, "User Not Found");
	}

	if (user.deletedAt) {
		throw new AppError(403, "User is deleted");
	}

	const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);

	if (!isPasswordMatched) {
		throw new AppError(401, "Invalid credentials");
	}

	const jwtPayload = {
		id: user.id,
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.jwt_secret,
		config.jwt.expires_in,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.refresh_token_secret,
		config.jwt.refresh_token_expires_in,
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
	let googlePayload: any = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});
		googlePayload = ticket.getPayload();
	} catch (error) {
		console.log("Google ID Token Verification Failed", error);
		throw new AppError(401, "Invalid Or Expired Google Id Token");
	}

	if (!googlePayload) {
		throw new AppError(401, "Invalid Or Expired Google Id Token");
	}

	if (!googlePayload.email) {
		throw new AppError(400, "Google Email Not Found");
	}

	if (!googlePayload.name) {
		throw new AppError(400, "Google User Name Not Found");
	}

	const email = googlePayload.email.trim().toLowerCase();

	let user = await prisma.user.findUnique({
		where: { email },
	});

	if (user) {
		if (user.deletedAt) {
			throw new AppError(403, "User is deleted");
		}
	} else {
		const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
		user = await prisma.user.create({
			data: {
				email,
				name: googlePayload.name,
				passwordHash: randomPassword,
				role: "CANDIDATE",
				candidateProfile: {
					create: {
						skills: [],
					},
				},
			},
		});

		// Send welcome email (non-blocking)
		sendEmail({
			to: user.email,
			subject: "Welcome to Developer Assessment Platform",
			templateName: "registration-user-otp",
			templateData: {
				name: user.name,
				email: user.email,
				otp: "GOOGLE_AUTH",
				expirationMinutes: 10,
			},
		}).catch((_err) => {});
	}

	const jwtPayload = {
		id: user.id,
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.jwt_secret,
		config.jwt.expires_in,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.refresh_token_secret,
		config.jwt.refresh_token_expires_in,
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

export const refreshToken = async (
	token: string,
): Promise<IRefreshTokenResponse> => {
	let decodedPayload: jwt.JwtPayload;
	try {
		decodedPayload = jwt.verify(
			token,
			config.jwt.refresh_token_secret as string,
		) as jwt.JwtPayload;
	} catch (_err: any) {
		throw new AppError(401, "Invalid or expired refresh token.");
	}

	const user = await prisma.user.findUnique({
		where: { id: decodedPayload.userId || decodedPayload.id },
	});

	if (!user || user.deletedAt) {
		throw new AppError(401, "User no longer exists or account is inactive.");
	}

	const jwtPayload = {
		id: user.id,
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwt.sign(jwtPayload, config.jwt.jwt_secret as string, {
		expiresIn: config.jwt.expires_in as any,
	});

	const newRefreshToken = jwt.sign(
		jwtPayload,
		config.jwt.refresh_token_secret as string,
		{
			expiresIn: config.jwt.refresh_token_expires_in as any,
		},
	);

	return {
		accessToken,
		refreshToken: newRefreshToken,
	};
};

export const changePassword = async (
	userId: string,
	payload: IChangePasswordInput,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user || user.deletedAt) {
		throw new AppError(404, "User not found.");
	}

	const isPasswordMatch = await bcrypt.compare(
		payload.oldPassword,
		user.passwordHash,
	);

	if (!isPasswordMatch) {
		throw new AppError(400, "Old password does not match.");
	}

	const newPasswordHash = await bcrypt.hash(payload.newPassword, 10);

	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash: newPasswordHash },
	});

	return { message: "Password changed successfully." };
};

export const AuthService = {
	registerUser,
	loginUser,
	forgotPassword,
	resetPassword,
	googleLogin,
	refreshToken,
	changePassword,
};
