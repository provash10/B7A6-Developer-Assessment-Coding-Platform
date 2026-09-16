import type { UserRole } from "@prisma/client";

export interface IUpdateProfileInput {
	name?: string;
	phone?: string;
	companyName?: string;
	companyWebsite?: string;
	resumeUrl?: string;
	skills?: string[];
	experienceYears?: number;
}

export interface IUserFilterParams {
	role?: UserRole;
	page?: number;
	limit?: number;
	searchTerm?: string;
}

export interface IUpdateUserRoleInput {
	userId: string;
	role: UserRole;
}
