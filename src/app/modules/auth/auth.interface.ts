import type { UserRole } from "@prisma/client";

export interface IRegisterUserInput {
	email: string;
	password: string;
	name: string;
	phone?: string;
	role?: UserRole;
	companyName?: string;
	companyWebsite?: string;
	skills?: string[];
	experienceYears?: number;
}

export interface ILoginUserInput {
	email: string;
	password: string;
}

export interface IForgotPasswordInput {
	email: string;
}

export interface IResetPasswordInput {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IGoogleLoginInput {
	idToken: string;
}

export interface IAuthUserResponse {
	id: string;
	email: string;
	name: string;
	role: UserRole;
}

export interface ILoginResponse {
	user: IAuthUserResponse;
	accessToken: string;
	refreshToken: string;
}

export interface IChangePasswordInput {
	oldPassword: string;
	newPassword: string;
}

export interface IRefreshTokenResponse {
	accessToken: string;
	refreshToken: string;
}
