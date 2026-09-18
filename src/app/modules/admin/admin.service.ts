import { type Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
	IAuditLogFilterParams,
	IDashboardStatsResponse,
} from "./admin.interface";

export const getDashboardStats = async (): Promise<IDashboardStatsResponse> => {
	// console.log("fetching dashboard stats from database");

	// fetch all dashboard statistics in parallel using promise all
	const [
		totalUsers,
		totalCandidates,
		totalRecruiters,
		totalAdmins,
		totalAssessments,
		totalQuestions,
		totalAttempts,
		totalSubmitted,
		totalPassed,
		revenueStats,
	] = await Promise.all([
		prisma.user.count({
			where: { deletedAt: null },
		}),
		prisma.user.count({
			where: { role: UserRole.CANDIDATE, deletedAt: null },
		}),
		prisma.user.count({
			where: { role: UserRole.RECRUITER, deletedAt: null },
		}),
		prisma.user.count({
			where: { role: UserRole.ADMIN, deletedAt: null },
		}),
		prisma.assessment.count({
			where: { deletedAt: null },
		}),
		prisma.question.count({
			where: { deletedAt: null },
		}),
		prisma.candidateAttempt.count({
			where: { deletedAt: null },
		}),
		prisma.candidateAttempt.count({
			where: { status: "SUBMITTED", deletedAt: null },
		}),
		prisma.candidateAttempt.count({
			where: { status: "SUBMITTED", isPassed: true, deletedAt: null },
		}),
		prisma.paymentTransaction.aggregate({
			where: { status: "SUCCESS" },
			_sum: { amount: true },
			_count: { id: true },
		}),
	]);

	// calculate submitted attempts and pass rates
	const totalFailed = totalSubmitted - totalPassed;
	const passRatePercentage =
		totalSubmitted > 0
			? Number(((totalPassed / totalSubmitted) * 100).toFixed(2))
			: 0;

	const totalRevenue = revenueStats._sum.amount
		? Number(revenueStats._sum.amount)
		: 0;
	const totalSuccessfulPayments = revenueStats._count.id || 0;

	// return formatted dashboard metrics object
	return {
		users: {
			totalUsers,
			totalCandidates,
			totalRecruiters,
			totalAdmins,
		},
		content: {
			totalAssessments,
			totalQuestions,
		},
		attempts: {
			totalAttempts,
			totalSubmitted,
			totalPassed,
			totalFailed,
			passRatePercentage,
		},
		revenue: {
			totalRevenue,
			totalSuccessfulPayments,
			currency: "BDT",
		},
	};
};

export const getAuditLogs = async (params: IAuditLogFilterParams) => {
	// console.log("fetching audit logs from database");
	const page = Number(params.page) || 1;
	const limit = Number(params.limit) || 10;
	const skip = (page - 1) * limit;

	// build filter conditions
	const whereCondition: Prisma.AuditLogWhereInput = {};

	if (params.action) {
		whereCondition.action = { equals: params.action, mode: "insensitive" };
	}

	if (params.entityType) {
		whereCondition.entityType = {
			equals: params.entityType,
			mode: "insensitive",
		};
	}

	if (params.userId) {
		whereCondition.userId = params.userId;
	}

	if (params.startDate || params.endDate) {
		whereCondition.createdAt = {};
		if (params.startDate) {
			whereCondition.createdAt.gte = new Date(params.startDate);
		}
		if (params.endDate) {
			whereCondition.createdAt.lte = new Date(params.endDate);
		}
	}

	if (params.searchTerm) {
		whereCondition.OR = [
			{ action: { contains: params.searchTerm, mode: "insensitive" } },
			{ entityType: { contains: params.searchTerm, mode: "insensitive" } },
			{ entityId: { contains: params.searchTerm, mode: "insensitive" } },
		];
	}

	// execute queries with pagination and user relations
	const [logs, total] = await Promise.all([
		prisma.auditLog.findMany({
			where: whereCondition,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
			},
		}),
		prisma.auditLog.count({
			where: whereCondition,
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages,
		},
		data: logs,
	};
};

export const createAuditLog = async (payload: {
	userId: string;
	action: string;
	entityType: string;
	entityId: string;
	oldValue?: any;
	newValue?: any;
	ipAddress?: string;
}) => {
	// console.log("recording audit log entry");
	return prisma.auditLog.create({
		data: {
			userId: payload.userId,
			action: payload.action,
			entityType: payload.entityType,
			entityId: payload.entityId,
			oldValue: payload.oldValue ?? undefined,
			newValue: payload.newValue ?? undefined,
			ipAddress: payload.ipAddress ?? null,
		},
	});
};

export const AdminService = {
	getDashboardStats,
	getAuditLogs,
	createAuditLog,
};
