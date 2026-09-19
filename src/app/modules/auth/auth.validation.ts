import { z } from "zod";

const registerSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		name: z.string().min(1, "Name is required"),
		phone: z.string().optional(),
		role: z.enum(["ADMIN", "RECRUITER", "CANDIDATE"]).default("CANDIDATE"),
		companyName: z.string().optional(),
		companyWebsite: z.string().optional(),
		skills: z.array(z.string()).optional(),
		experienceYears: z.number().optional(),
	}),
});

const loginSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address"),
		password: z.string().min(1, "Password is required"),
	}),
});

const forgotPasswordSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address"),
	}),
});

const resetPasswordSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address"),
		otp: z.string().min(4, "OTP is required"),
		newPassword: z.string().min(6, "Password must be at least 6 characters"),
	}),
});

const googleLoginSchema = z.object({
	body: z
		.object({
			idToken: z.string().optional(),
			id_token: z.string().optional(),
		})
		.refine((data) => data.idToken || data.id_token, {
			message: "Google ID Token (idToken or id_token) is required",
		}),
});

const changePasswordSchema = z.object({
	body: z.object({
		oldPassword: z.string().min(1, "Old password is required"),
		newPassword: z
			.string()
			.min(6, "New password must be at least 6 characters"),
	}),
});

export const AuthValidation = {
	registerSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	googleLoginSchema,
	changePasswordSchema,
};
