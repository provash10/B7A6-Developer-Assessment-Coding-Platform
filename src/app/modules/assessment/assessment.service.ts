import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type { ICreateAssessmentInput } from "./assessment.interface";

export const createAssessment = async (
	userId: string,
	payload: ICreateAssessmentInput,
) => {
	// console.log("Creating assessment for userId:", userId);
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

export const AssessmentService = {
	createAssessment,
};
