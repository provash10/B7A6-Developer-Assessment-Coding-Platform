import type { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { createAuditLog } from "../admin/admin.service";
import type { IUpdateProfileInput, IUserFilterParams } from "./user.interface";

export const getMyProfile = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			recruiterProfile: true,
			candidateProfile: true,
		},
	});

	if (!user || user.deletedAt) {
		throw new AppError(404, "User profile not found.");
	}

	const { passwordHash: _, ...userWithoutPassword } = user;
	return userWithoutPassword;
};

export const updateMyProfile = async (
	userId: string,
	payload: IUpdateProfileInput,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			recruiterProfile: true,
			candidateProfile: true,
		},
	});

	if (!user || user.deletedAt) {
		throw new AppError(404, "User profile not found.");
	}

	const updatedUser = await prisma.$transaction(async (tx) => {
		const userResult = await tx.user.update({
			where: { id: userId },
			data: {
				name: payload.name ?? user.name,
				phone: payload.phone ?? user.phone,
			},
		});

		if (user.role === "RECRUITER" && user.recruiterProfile) {
			await tx.recruiterProfile.update({
				where: { id: user.recruiterProfile.id },
				data: {
					companyName: payload.companyName ?? user.recruiterProfile.companyName,
					companyWebsite:
						payload.companyWebsite ?? user.recruiterProfile.companyWebsite,
				},
			});
		} else if (user.role === "CANDIDATE" && user.candidateProfile) {
			await tx.candidateProfile.update({
				where: { id: user.candidateProfile.id },
				data: {
					resumeUrl: payload.resumeUrl ?? user.candidateProfile.resumeUrl,
					skills: payload.skills ?? user.candidateProfile.skills,
					experienceYears:
						payload.experienceYears ?? user.candidateProfile.experienceYears,
				},
			});
		}

		return userResult;
	});

	// console.log(updatedUser);
	return getMyProfile(updatedUser.id);
};

export const getAllUsers = async (query: IUserFilterParams) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: any = {
		deletedAt: null,
	};

	if (query.role) {
		whereConditions.role = query.role;
	}

	const total = await prisma.user.count({ where: whereConditions });
	const users = await prisma.user.findMany({
		where: whereConditions,
		skip,
		take: limit,
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			email: true,
			name: true,
			phone: true,
			role: true,
			createdAt: true,
			updatedAt: true,
			recruiterProfile: true,
			candidateProfile: true,
		},
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: users,
	};
};

export const updateUserRole = async (
	userId: string,
	role: UserRole,
	performedBy?: string,
	ipAddress?: string,
) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new AppError(404, "User not found.");
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { role },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			updatedAt: true,
		},
	});

	// record audit log entry for role change
	if (performedBy) {
		await createAuditLog({
			userId: performedBy,
			action: "USER_ROLE_UPDATED",
			entityType: "USER",
			entityId: userId,
			oldValue: { role: user.role },
			newValue: { role },
			ipAddress: ipAddress ?? undefined,
		});
	}

	return updatedUser;
};

export const UserService = {
	getMyProfile,
	updateMyProfile,
	getAllUsers,
	updateUserRole,
};
