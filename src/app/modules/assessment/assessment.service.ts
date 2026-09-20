import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { createAuditLog } from "../admin/admin.service";
import type {
	IAddQuestionToAssessmentInput,
	IAssessmentAnalytics,
	IAssessmentFilterParams,
	ICreateAssessmentInput,
	ILeaderboardEntry,
	IUpdateAssessmentInput,
} from "./assessment.interface";

export const createAssessment = async (
	userId: string,
	payload: ICreateAssessmentInput,
) => {
	// console.log("creating assessment for userid:", userid);
	let recruiterProfile = await prisma.recruiterProfile.findUnique({
		where: { userId },
	});

	if (!recruiterProfile) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new AppError(404, "User not found.");
		}

		if (user.role === "ADMIN" || user.role === "RECRUITER") {
			recruiterProfile = await prisma.recruiterProfile.create({
				data: {
					userId: user.id,
					companyName: "System Assessment Center",
				},
			});
		} else {
			throw new AppError(
				403,
				"Only recruiters or admins can create assessments.",
			);
		}
	}

	let totalMarks = 0;
	let validQuestions: { id: string; marks: number }[] = [];

	if (payload.questions && payload.questions.length > 0) {
		const questionIds = payload.questions.map((q) => q.questionId);
		validQuestions = await prisma.question.findMany({
			where: {
				id: { in: questionIds },
				deletedAt: null,
			},
			select: {
				id: true,
				marks: true,
			},
		});

		if (validQuestions.length !== questionIds.length) {
			throw new AppError(
				400,
				"One or more specified questions do not exist or have been deleted.",
			);
		}

		totalMarks = validQuestions.reduce((sum, q) => sum + q.marks, 0);
	}

	const result = await prisma.$transaction(async (tx) => {
		const newAssessment = await tx.assessment.create({
			data: {
				recruiterId: recruiterProfile.id,
				title: payload.title,
				description: payload.description,
				durationMinutes: payload.durationMinutes,
				passMarks: payload.passMarks,
				totalMarks,
				status: "DRAFT",
				startTime: payload.startTime ? new Date(payload.startTime) : null,
				endTime: payload.endTime ? new Date(payload.endTime) : null,
			},
		});

		if (payload.questions && payload.questions.length > 0) {
			const assessmentQuestionsData = payload.questions.map((q, index) => ({
				assessmentId: newAssessment.id,
				questionId: q.questionId,
				orderIndex: q.orderIndex ?? index + 1,
			}));

			await tx.assessmentQuestion.createMany({
				data: assessmentQuestionsData,
			});
		}

		return newAssessment;
	});

	const createdAssessment = await prisma.assessment.findUnique({
		where: { id: result.id },
		include: {
			assessmentQuestions: {
				include: {
					question: true,
				},
				orderBy: {
					orderIndex: "asc",
				},
			},
		},
	});

	return createdAssessment;
};

export const getAllAssessments = async (query: IAssessmentFilterParams) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: Prisma.AssessmentWhereInput = {
		deletedAt: null,
	};

	if (query.searchTerm) {
		whereConditions.OR = [
			{ title: { contains: query.searchTerm, mode: "insensitive" } },
			{ description: { contains: query.searchTerm, mode: "insensitive" } },
		];
	}

	if (query.status) {
		whereConditions.status = query.status;
	}

	if (query.recruiterId) {
		whereConditions.recruiterId = query.recruiterId;
	}

	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	const total = await prisma.assessment.count({ where: whereConditions });
	const assessments = await prisma.assessment.findMany({
		where: whereConditions,
		skip,
		take: limit,
		orderBy: { [sortBy]: sortOrder },
		include: {
			recruiter: {
				select: {
					id: true,
					companyName: true,
					user: {
						select: {
							name: true,
							email: true,
						},
					},
				},
			},
			_count: {
				select: {
					assessmentQuestions: true,
					invitations: true,
					attempts: true,
				},
			},
		},
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: assessments,
	};
};

export const getAssessmentById = async (id: string) => {
	const assessment = await prisma.assessment.findFirst({
		where: {
			id,
			deletedAt: null,
		},
		include: {
			recruiter: {
				select: {
					id: true,
					companyName: true,
					companyWebsite: true,
					user: {
						select: {
							name: true,
							email: true,
							phone: true,
						},
					},
				},
			},
			assessmentQuestions: {
				orderBy: {
					orderIndex: "asc",
				},
				include: {
					question: true,
				},
			},
			_count: {
				select: {
					invitations: true,
					attempts: true,
				},
			},
		},
	});

	if (!assessment) {
		throw new AppError(404, "Assessment not found.");
	}

	return assessment;
};

export const updateAssessment = async (
	id: string,
	payload: IUpdateAssessmentInput,
) => {
	const existingAssessment = await prisma.assessment.findFirst({
		where: { id, deletedAt: null },
		include: {
			assessmentQuestions: true,
		},
	});

	if (!existingAssessment) {
		throw new AppError(404, "Assessment not found.");
	}

	if (
		payload.status === "PUBLISHED" &&
		existingAssessment.assessmentQuestions.length === 0
	) {
		throw new AppError(
			400,
			"Cannot publish an assessment with zero assigned questions.",
		);
	}

	const updatedAssessment = await prisma.assessment.update({
		where: { id },
		data: {
			...(payload.title !== undefined && { title: payload.title }),
			...(payload.description !== undefined && {
				description: payload.description,
			}),
			...(payload.durationMinutes !== undefined && {
				durationMinutes: payload.durationMinutes,
			}),
			...(payload.passMarks !== undefined && { passMarks: payload.passMarks }),
			...(payload.status !== undefined && { status: payload.status }),
			...(payload.startTime !== undefined && {
				startTime: payload.startTime ? new Date(payload.startTime) : null,
			}),
			...(payload.endTime !== undefined && {
				endTime: payload.endTime ? new Date(payload.endTime) : null,
			}),
		},
		include: {
			assessmentQuestions: {
				include: { question: true },
				orderBy: { orderIndex: "asc" },
			},
		},
	});

	return updatedAssessment;
};

export const addQuestionToAssessment = async (
	assessmentId: string,
	payload: IAddQuestionToAssessmentInput,
) => {
	const assessment = await prisma.assessment.findFirst({
		where: { id: assessmentId, deletedAt: null },
	});

	if (!assessment) {
		throw new AppError(404, "Assessment not found.");
	}

	const question = await prisma.question.findFirst({
		where: { id: payload.questionId, deletedAt: null },
	});

	if (!question) {
		throw new AppError(404, "Question not found.");
	}

	const existingAssignment = await prisma.assessmentQuestion.findUnique({
		where: {
			assessmentId_questionId: {
				assessmentId,
				questionId: payload.questionId,
			},
		},
	});

	if (existingAssignment) {
		throw new AppError(400, "Question is already assigned to this assessment.");
	}

	let orderIndex = payload.orderIndex;
	if (!orderIndex) {
		const maxOrder = await prisma.assessmentQuestion.aggregate({
			where: { assessmentId },
			_max: { orderIndex: true },
		});
		orderIndex = (maxOrder._max.orderIndex || 0) + 1;
	}

	await prisma.$transaction(async (tx) => {
		await tx.assessmentQuestion.create({
			data: {
				assessmentId,
				questionId: payload.questionId,
				orderIndex,
			},
		});

		const allAssignedQuestions = await tx.assessmentQuestion.findMany({
			where: { assessmentId },
			include: { question: true },
		});

		const newTotalMarks = allAssignedQuestions.reduce(
			(sum, aq) => sum + aq.question.marks,
			0,
		);

		await tx.assessment.update({
			where: { id: assessmentId },
			data: { totalMarks: newTotalMarks },
		});
	});

	return getAssessmentById(assessmentId);
};

export const removeQuestionFromAssessment = async (
	assessmentId: string,
	questionId: string,
) => {
	const assessment = await prisma.assessment.findFirst({
		where: { id: assessmentId, deletedAt: null },
	});

	if (!assessment) {
		throw new AppError(404, "Assessment not found.");
	}

	const existingAssignment = await prisma.assessmentQuestion.findUnique({
		where: {
			assessmentId_questionId: {
				assessmentId,
				questionId,
			},
		},
	});

	if (!existingAssignment) {
		throw new AppError(404, "Question is not assigned to this assessment.");
	}

	await prisma.$transaction(async (tx) => {
		await tx.assessmentQuestion.delete({
			where: {
				assessmentId_questionId: {
					assessmentId,
					questionId,
				},
			},
		});

		const remainingQuestions = await tx.assessmentQuestion.findMany({
			where: { assessmentId },
			include: { question: true },
		});

		const newTotalMarks = remainingQuestions.reduce(
			(sum, aq) => sum + aq.question.marks,
			0,
		);

		await tx.assessment.update({
			where: { id: assessmentId },
			data: { totalMarks: newTotalMarks },
		});
	});

	return getAssessmentById(assessmentId);
};

export const deleteAssessment = async (
	id: string,
	deletedBy?: string,
	ipAddress?: string,
) => {
	const existingAssessment = await prisma.assessment.findFirst({
		where: { id, deletedAt: null },
	});

	if (!existingAssessment) {
		throw new AppError(404, "Assessment not found or already deleted.");
	}

	const deletedAssessment = await prisma.assessment.update({
		where: { id },
		data: {
			deletedAt: new Date(),
		},
	});

	// record audit log entry for assessment deletion
	if (deletedBy) {
		await createAuditLog({
			userId: deletedBy,
			action: "ASSESSMENT_DELETED",
			entityType: "ASSESSMENT",
			entityId: id,
			oldValue: {
				title: existingAssessment.title,
				recruiterId: existingAssessment.recruiterId,
			},
			ipAddress: ipAddress ?? undefined,
		});
	}

	return deletedAssessment;
};

export const getAssessmentLeaderboard = async (
	assessmentId: string,
	userId: string,
	userRole: string,
	query: { page?: number; limit?: number },
) => {
	// verify assessment existence
	// console.log("checking assessment existence for leaderboard");
	const assessment = await prisma.assessment.findFirst({
		where: { id: assessmentId, deletedAt: null },
	});

	if (!assessment) {
		throw new AppError(404, "Assessment not found.");
	}

	// verify recruiter ownership if not admin
	// console.log("verifying recruiter authorization");
	if (userRole !== "ADMIN") {
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});
		if (!recruiterProfile || assessment.recruiterId !== recruiterProfile.id) {
			throw new AppError(
				403,
				"You are not authorized to view the leaderboard for this assessment.",
			);
		}
	}

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	// query candidate attempts ordered by total score descending and submit time ascending
	// console.log("fetching submitted attempts for leaderboard");
	const [attempts, total] = await Promise.all([
		prisma.candidateAttempt.findMany({
			where: {
				assessmentId,
				status: "SUBMITTED",
				deletedAt: null,
			},
			orderBy: [{ totalScore: "desc" }, { submittedAt: "asc" }],
			skip,
			take: limit,
			include: {
				candidate: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
			},
		}),
		prisma.candidateAttempt.count({
			where: {
				assessmentId,
				status: "SUBMITTED",
				deletedAt: null,
			},
		}),
	]);

	// map candidate leaderboard rankings and performance metrics
	// console.log("mapping leaderboard rankings");
	const totalMarks = assessment.totalMarks || 100;
	const leaderboard: ILeaderboardEntry[] = attempts.map((attempt, index) => {
		let durationMinutesTaken = 0;
		if (attempt.startedAt && attempt.submittedAt) {
			durationMinutesTaken = Math.max(
				1,
				Math.round(
					(attempt.submittedAt.getTime() - attempt.startedAt.getTime()) /
						(1000 * 60),
				),
			);
		}

		const percentage =
			totalMarks > 0
				? Number(((attempt.totalScore / totalMarks) * 100).toFixed(2))
				: 0;

		return {
			rank: skip + index + 1,
			attemptId: attempt.id,
			candidateId: attempt.candidate.id,
			candidateName: attempt.candidate.user.name,
			candidateEmail: attempt.candidate.user.email,
			totalScore: attempt.totalScore,
			percentage,
			isPassed: attempt.isPassed,
			durationMinutesTaken,
			submittedAt: attempt.submittedAt,
			antiCheatFlags: attempt.antiCheatFlags,
		};
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: leaderboard,
	};
};

export const getAssessmentAnalytics = async (
	assessmentId: string,
	userId: string,
	userRole: string,
): Promise<IAssessmentAnalytics> => {
	// verify assessment existence
	// console.log("checking assessment existence for analytics");
	const assessment = await prisma.assessment.findFirst({
		where: { id: assessmentId, deletedAt: null },
	});

	if (!assessment) {
		throw new AppError(404, "Assessment not found.");
	}

	// verify recruiter ownership if not admin
	// console.log("verifying recruiter authorization for analytics");
	if (userRole !== "ADMIN") {
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});
		if (!recruiterProfile || assessment.recruiterId !== recruiterProfile.id) {
			throw new AppError(
				403,
				"You are not authorized to view analytics for this assessment.",
			);
		}
	}

	// fetch aggregate stats invitations and attempts counts
	// console.log("fetching aggregate stats for assessment");
	const [totalInvitations, attempts, aggregateStats] = await Promise.all([
		prisma.assessmentInvitation.count({
			where: { assessmentId, deletedAt: null },
		}),
		prisma.candidateAttempt.findMany({
			where: { assessmentId, deletedAt: null },
			select: {
				status: true,
				isPassed: true,
				totalScore: true,
			},
		}),
		prisma.candidateAttempt.aggregate({
			where: { assessmentId, status: "SUBMITTED", deletedAt: null },
			_avg: { totalScore: true },
			_max: { totalScore: true },
			_min: { totalScore: true },
		}),
	]);

	// calculate metrics and pass rates
	// console.log("calculating analytics metrics");
	const totalAttempts = attempts.length;
	const submittedAttempts = attempts.filter((a) => a.status === "SUBMITTED");
	const totalSubmitted = submittedAttempts.length;
	const totalPassed = submittedAttempts.filter((a) => a.isPassed).length;
	const totalFailed = totalSubmitted - totalPassed;
	const passRatePercentage =
		totalSubmitted > 0
			? Number(((totalPassed / totalSubmitted) * 100).toFixed(2))
			: 0;

	const averageScore = Number((aggregateStats._avg.totalScore || 0).toFixed(2));
	const highestScore = aggregateStats._max.totalScore || 0;
	const lowestScore = aggregateStats._min.totalScore || 0;

	return {
		assessmentId: assessment.id,
		assessmentTitle: assessment.title,
		totalInvitations,
		totalAttempts,
		totalSubmittedAttempts: totalSubmitted,
		totalPassed,
		totalFailed,
		passRatePercentage,
		averageScore,
		highestScore,
		lowestScore,
		totalMarks: assessment.totalMarks,
		passMarks: assessment.passMarks,
	};
};

export const AssessmentService = {
	createAssessment,
	getAllAssessments,
	getAssessmentById,
	updateAssessment,
	addQuestionToAssessment,
	removeQuestionFromAssessment,
	deleteAssessment,
	getAssessmentLeaderboard,
	getAssessmentAnalytics,
};
