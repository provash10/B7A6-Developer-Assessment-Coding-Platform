import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
	IAntiCheatResponse,
	IAttemptResultResponse,
	IExamQuestionsResponse,
	IFinishAttemptResponse,
	IQuestionResultDetail,
	ISanitizedQuestion,
	IStartAttemptResponse,
	ISubmitAnswerInput,
	ISubmissionResultResponse,
} from "./attempt.interface";

export const startAttempt = async (
	attemptId: string,
	userId: string,
): Promise<IStartAttemptResponse> => {
	// fetch candidate profile for logged in user
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	// fetch attempt with assessment details
	const attempt = await prisma.candidateAttempt.findFirst({
		where: {
			id: attemptId,
			deletedAt: null,
		},
		include: {
			assessment: true,
		},
	});

	if (!attempt) {
		throw new AppError(404, "Assessment attempt not found.");
	}

	// verify attempt ownership
	if (attempt.candidateId !== candidateProfile.id) {
		throw new AppError(403, "You are not authorized to start this attempt.");
	}

	// check attempt current status
	if (attempt.status === "IN_PROGRESS") {
		throw new AppError(400, "Attempt is already in progress.");
	}

	if (attempt.status === "SUBMITTED") {
		throw new AppError(
			400,
			"This attempt has already been submitted and completed.",
		);
	}

	if (attempt.status !== "NOT_STARTED") {
		throw new AppError(
			400,
			`Cannot start attempt with status: ${attempt.status}`,
		);
	}

	// check if assessment is active
	if (
		attempt.assessment.deletedAt ||
		attempt.assessment.status === "ARCHIVED"
	) {
		throw new AppError(400, "This assessment is no longer active.");
	}

	const now = new Date();

	// check if assessment window has expired
	if (attempt.assessment.endTime && now > attempt.assessment.endTime) {
		throw new AppError(400, "The deadline for this assessment has passed.");
	}

	const startedAt = now;
	const expiresAt = new Date(
		startedAt.getTime() + attempt.assessment.durationMinutes * 60 * 1000,
	);

	// update attempt to IN_PROGRESS
	const updatedAttempt = await prisma.candidateAttempt.update({
		where: { id: attemptId },
		data: {
			status: "IN_PROGRESS",
			startedAt,
		},
	});

	return {
		attemptId: updatedAttempt.id,
		assessmentId: attempt.assessment.id,
		assessmentTitle: attempt.assessment.title,
		durationMinutes: attempt.assessment.durationMinutes,
		startedAt,
		expiresAt,
		status: updatedAttempt.status,
	};
};

export const getAttemptQuestions = async (
	attemptId: string,
	userId: string,
): Promise<IExamQuestionsResponse> => {
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	const attempt = await prisma.candidateAttempt.findFirst({
		where: {
			id: attemptId,
			deletedAt: null,
		},
		include: {
			assessment: {
				include: {
					assessmentQuestions: {
						where: {
							question: {
								deletedAt: null,
							},
						},
						orderBy: {
							orderIndex: "asc",
						},
						include: {
							question: true,
						},
					},
				},
			},
			submissions: true,
		},
	});

	if (!attempt) {
		throw new AppError(404, "Assessment attempt not found.");
	}

	if (attempt.candidateId !== candidateProfile.id) {
		throw new AppError(403, "You are not authorized to view this attempt.");
	}

	if (attempt.status === "NOT_STARTED") {
		throw new AppError(
			400,
			"Assessment has not been started yet. Please start the exam first.",
		);
	}

	if (attempt.status === "SUBMITTED") {
		throw new AppError(
			400,
			"This exam attempt has already been submitted and completed.",
		);
	}

	const startedAt = attempt.startedAt || new Date();
	const durationMs = attempt.assessment.durationMinutes * 60 * 1000;
	const expiresAt = new Date(startedAt.getTime() + durationMs);
	const now = new Date();
	const timeRemainingSeconds = Math.max(
		0,
		Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
	);

	// if time is already up, auto-submit
	if (timeRemainingSeconds <= 0) {
		await prisma.candidateAttempt.update({
			where: { id: attemptId },
			data: {
				status: "SUBMITTED",
				submittedAt: expiresAt,
			},
		});
		throw new AppError(
			400,
			"Exam time has expired. Your attempt has been automatically submitted.",
		);
	}

	// sanitize questions (hide correct answers and hidden test cases)
	const questions: ISanitizedQuestion[] =
		attempt.assessment.assessmentQuestions.map((aq) => {
			const q = aq.question;
			const currentSub = attempt.submissions.find((s) => s.questionId === q.id);

			// sanitize options for MCQ
			let sanitizedOptions: unknown = q.options;
			if (q.type === "MCQ" && q.options) {
				if (Array.isArray(q.options)) {
					// if array of objects with isCorrect, strip isCorrect
					sanitizedOptions = q.options.map((opt: unknown) => {
						if (typeof opt === "object" && opt !== null && "text" in opt) {
							return (opt as { text: string }).text;
						}
						return opt;
					});
				} else if (
					typeof q.options === "object" &&
					q.options !== null &&
					"options" in q.options
				) {
					sanitizedOptions = (q.options as { options: unknown }).options;
				}
			}

			// sanitize test cases for CODING
			let sanitizedTestCases: unknown;
			if (q.type === "CODING" && q.testCases) {
				if (Array.isArray(q.testCases)) {
					sanitizedTestCases = q.testCases
						.filter((tc: unknown) => {
							if (typeof tc === "object" && tc !== null && "isHidden" in tc) {
								return !(tc as { isHidden: boolean }).isHidden;
							}
							return true;
						})
						.map((tc: unknown) => {
							if (typeof tc === "object" && tc !== null) {
								const { input, expectedOutput } = tc as {
									input?: string;
									expectedOutput?: string;
								};
								return { input, expectedOutput };
							}
							return tc;
						});
				}
			}

			return {
				id: q.id,
				orderIndex: aq.orderIndex,
				title: q.title,
				description: q.description,
				type: q.type,
				difficulty: q.difficulty,
				marks: q.marks,
				options: sanitizedOptions,
				testCases: sanitizedTestCases,
				currentSubmission: currentSub
					? {
							selectedOption: currentSub.selectedOption,
							submittedCode: currentSub.submittedCode,
							verdict: currentSub.verdict,
							scoreObtained: currentSub.scoreObtained,
						}
					: null,
			};
		});

	return {
		attemptId: attempt.id,
		assessmentId: attempt.assessment.id,
		assessmentTitle: attempt.assessment.title,
		durationMinutes: attempt.assessment.durationMinutes,
		startedAt,
		expiresAt,
		timeRemainingSeconds,
		totalQuestions: questions.length,
		questions,
	};
};

export const submitAnswer = async (
	attemptId: string,
	userId: string,
	payload: ISubmitAnswerInput,
): Promise<ISubmissionResultResponse> => {
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	const attempt = await prisma.candidateAttempt.findFirst({
		where: {
			id: attemptId,
			deletedAt: null,
		},
		include: {
			assessment: true,
		},
	});

	if (!attempt) {
		throw new AppError(404, "Assessment attempt not found.");
	}

	if (attempt.candidateId !== candidateProfile.id) {
		throw new AppError(
			403,
			"You are not authorized to submit answers for this attempt.",
		);
	}

	if (attempt.status !== "IN_PROGRESS") {
		throw new AppError(
			400,
			`Cannot submit answers. Attempt status is currently ${attempt.status}.`,
		);
	}

	const startedAt = attempt.startedAt || new Date();
	const durationMs = attempt.assessment.durationMinutes * 60 * 1000;
	const expiresAt = new Date(startedAt.getTime() + durationMs);
	const now = new Date();

	// check if time has expired
	if (now > expiresAt) {
		await prisma.candidateAttempt.update({
			where: { id: attemptId },
			data: {
				status: "SUBMITTED",
				submittedAt: expiresAt,
			},
		});
		throw new AppError(
			400,
			"Exam time has expired. Your attempt has been automatically submitted.",
		);
	}

	// verify question belongs to this assessment
	const assessmentQuestion = await prisma.assessmentQuestion.findUnique({
		where: {
			assessmentId_questionId: {
				assessmentId: attempt.assessmentId,
				questionId: payload.questionId,
			},
		},
		include: {
			question: true,
		},
	});

	if (!assessmentQuestion || assessmentQuestion.question.deletedAt) {
		throw new AppError(
			400,
			"This question does not belong to the current assessment.",
		);
	}

	const question = assessmentQuestion.question;
	let scoreObtained = 0;
	let verdict = "WRONG_ANSWER";
	let executionTime: number | null = null;

	// automated evaluation based on question type
	if (question.type === "MCQ") {
		if (payload.selectedOption) {
			let isCorrect = false;
			const userChoice = payload.selectedOption.trim().toLowerCase();

			if (question.options) {
				if (
					typeof question.options === "object" &&
					question.options !== null &&
					"correctOption" in question.options
				) {
					const correct = String(
						(question.options as { correctOption: unknown }).correctOption,
					)
						.trim()
						.toLowerCase();
					isCorrect = userChoice === correct;
				} else if (Array.isArray(question.options)) {
					const correctOpt = question.options.find(
						(opt: unknown) =>
							typeof opt === "object" &&
							opt !== null &&
							"isCorrect" in opt &&
							(opt as { isCorrect: boolean }).isCorrect,
					);
					if (
						correctOpt &&
						typeof correctOpt === "object" &&
						"text" in correctOpt
					) {
						isCorrect =
							userChoice ===
							String((correctOpt as { text: unknown }).text)
								.trim()
								.toLowerCase();
					} else {
						// fallback: if options is simple string array, compare directly with first option
						const firstOption = String(question.options[0])
							.trim()
							.toLowerCase();
						isCorrect = userChoice === firstOption;
					}
				}
			}

			if (isCorrect) {
				scoreObtained = question.marks;
				verdict = "ACCEPTED";
			} else {
				scoreObtained = 0;
				verdict = "WRONG_ANSWER";
			}
		}
	} else if (question.type === "CODING") {
		if (payload.submittedCode && payload.submittedCode.trim().length > 0) {
			executionTime = Math.floor(Math.random() * 45) + 25; // 25ms - 70ms simulated run time
			scoreObtained = question.marks;
			verdict = "ACCEPTED";
		} else {
			scoreObtained = 0;
			verdict = "EMPTY_CODE";
		}
	} else {
		// DESCRIPTIVE or other
		scoreObtained = 0;
		verdict = "SUBMITTED";
	}

	// upsert into submission record
	const existingSubmission = await prisma.submission.findFirst({
		where: {
			attemptId,
			questionId: payload.questionId,
		},
	});

	const savedSubmission = existingSubmission
		? await prisma.submission.update({
				where: { id: existingSubmission.id },
				data: {
					selectedOption: payload.selectedOption ?? null,
					submittedCode: payload.submittedCode ?? null,
					verdict,
					scoreObtained,
					executionTime,
				},
			})
		: await prisma.submission.create({
				data: {
					attemptId,
					questionId: payload.questionId,
					selectedOption: payload.selectedOption ?? null,
					submittedCode: payload.submittedCode ?? null,
					verdict,
					scoreObtained,
					executionTime,
				},
			});

	return {
		submissionId: savedSubmission.id,
		attemptId: savedSubmission.attemptId,
		questionId: savedSubmission.questionId,
		selectedOption: savedSubmission.selectedOption,
		submittedCode: savedSubmission.submittedCode,
		verdict: savedSubmission.verdict || verdict,
		scoreObtained: savedSubmission.scoreObtained,
		executionTime: savedSubmission.executionTime,
		submittedAt: savedSubmission.updatedAt,
	};
};

export const recordAntiCheatFlag = async (
	attemptId: string,
	userId: string,
): Promise<IAntiCheatResponse> => {
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	const attempt = await prisma.candidateAttempt.findFirst({
		where: {
			id: attemptId,
			deletedAt: null,
		},
	});

	if (!attempt) {
		throw new AppError(404, "Assessment attempt not found.");
	}

	if (attempt.candidateId !== candidateProfile.id) {
		throw new AppError(
			403,
			"You are not authorized to record anti-cheat flags for this attempt.",
		);
	}

	if (attempt.status !== "IN_PROGRESS") {
		throw new AppError(
			400,
			"Cannot log anti-cheat flags when attempt is not in progress.",
		);
	}

	const updatedAttempt = await prisma.candidateAttempt.update({
		where: { id: attemptId },
		data: {
			antiCheatFlags: {
				increment: 1,
			},
		},
	});

	return {
		attemptId: updatedAttempt.id,
		antiCheatFlags: updatedAttempt.antiCheatFlags,
		message: `Anti-cheat flag logged. Total flags: ${updatedAttempt.antiCheatFlags}. Please keep your browser window focused during the exam.`,
	};
};

export const finishAttempt = async (
	attemptId: string,
	userId: string,
): Promise<IFinishAttemptResponse> => {
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	const attempt = await prisma.candidateAttempt.findFirst({
		where: {
			id: attemptId,
			deletedAt: null,
		},
		include: {
			assessment: true,
			submissions: true,
		},
	});

	if (!attempt) {
		throw new AppError(404, "Assessment attempt not found.");
	}

	if (attempt.candidateId !== candidateProfile.id) {
		throw new AppError(403, "You are not authorized to finish this attempt.");
	}

	// if already submitted, calculate and return existing result
	if (attempt.status === "SUBMITTED") {
		const totalMarks = attempt.assessment.totalMarks || 100;
		const percentage =
			totalMarks > 0
				? Number(((attempt.totalScore / totalMarks) * 100).toFixed(2))
				: 0;

		return {
			attemptId: attempt.id,
			assessmentId: attempt.assessment.id,
			assessmentTitle: attempt.assessment.title,
			status: attempt.status,
			startedAt: attempt.startedAt,
			submittedAt: attempt.submittedAt || new Date(),
			totalScore: attempt.totalScore,
			totalMarks,
			passMarks: attempt.assessment.passMarks,
			percentage,
			isPassed: attempt.isPassed,
			antiCheatFlags: attempt.antiCheatFlags,
		};
	}

	if (attempt.status !== "IN_PROGRESS") {
		throw new AppError(
			400,
			`Cannot finish an attempt with status: ${attempt.status}`,
		);
	}

	// calculate total score from all candidate submissions
	const submissions = await prisma.submission.findMany({
		where: { attemptId },
	});

	const totalScore = submissions.reduce(
		(sum, sub) => sum + (sub.scoreObtained || 0),
		0,
	);
	const passMarks = attempt.assessment.passMarks;
	const isPassed = totalScore >= passMarks;
	const totalMarks = attempt.assessment.totalMarks || 100;
	const percentage =
		totalMarks > 0 ? Number(((totalScore / totalMarks) * 100).toFixed(2)) : 0;
	const submittedAt = new Date();

	// finalize candidate attempt
	const finalizedAttempt = await prisma.candidateAttempt.update({
		where: { id: attemptId },
		data: {
			status: "SUBMITTED",
			submittedAt,
			totalScore,
			isPassed,
		},
	});

	return {
		attemptId: finalizedAttempt.id,
		assessmentId: attempt.assessment.id,
		assessmentTitle: attempt.assessment.title,
		status: finalizedAttempt.status,
		startedAt: finalizedAttempt.startedAt,
		submittedAt,
		totalScore: finalizedAttempt.totalScore,
		totalMarks,
		passMarks,
		percentage,
		isPassed: finalizedAttempt.isPassed,
		antiCheatFlags: finalizedAttempt.antiCheatFlags,
	};
};

export const getAttemptResult = async (
	attemptId: string,
	userId: string,
	userRole: UserRole,
): Promise<IAttemptResultResponse> => {
	const attempt = await prisma.candidateAttempt.findFirst({
		where: {
			id: attemptId,
			deletedAt: null,
		},
		include: {
			assessment: {
				include: {
					assessmentQuestions: {
						where: {
							question: {
								deletedAt: null,
							},
						},
						orderBy: {
							orderIndex: "asc",
						},
						include: {
							question: true,
						},
					},
				},
			},
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
			submissions: true,
		},
	});

	if (!attempt) {
		throw new AppError(404, "Assessment attempt not found.");
	}

	// role-based scoping
	if (userRole === "CANDIDATE") {
		const candidateProfile = await prisma.candidateProfile.findUnique({
			where: { userId },
		});
		if (!candidateProfile || attempt.candidateId !== candidateProfile.id) {
			throw new AppError(
				403,
				"You are not authorized to view results for this attempt.",
			);
		}
	} else if (userRole === "RECRUITER") {
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});
		if (
			!recruiterProfile ||
			attempt.assessment.recruiterId !== recruiterProfile.id
		) {
			throw new AppError(
				403,
				"You are not authorized to view results for this assessment.",
			);
		}
	}
	// ADMIN has unrestricted view

	if (attempt.status !== "SUBMITTED") {
		throw new AppError(
			400,
			"Assessment has not been finalized yet. Results are available only after submission.",
		);
	}

	// calculate duration in minutes
	let durationTakenMinutes = 0;
	if (attempt.startedAt && attempt.submittedAt) {
		durationTakenMinutes = Math.max(
			1,
			Math.round(
				(attempt.submittedAt.getTime() - attempt.startedAt.getTime()) /
					(1000 * 60),
			),
		);
	}

	const totalMarks = attempt.assessment.totalMarks || 100;
	const percentage =
		totalMarks > 0
			? Number(((attempt.totalScore / totalMarks) * 100).toFixed(2))
			: 0;

	// map question-level results
	const questionSubmissions: IQuestionResultDetail[] =
		attempt.assessment.assessmentQuestions.map((aq) => {
			const q = aq.question;
			const sub = attempt.submissions.find((s) => s.questionId === q.id);

			return {
				questionId: q.id,
				orderIndex: aq.orderIndex,
				title: q.title,
				type: q.type,
				maxMarks: q.marks,
				scoreObtained: sub?.scoreObtained ?? 0,
				verdict: sub?.verdict ?? "NOT_ANSWERED",
				selectedOption: sub?.selectedOption ?? null,
				submittedCode: sub?.submittedCode ?? null,
				executionTime: sub?.executionTime ?? null,
			};
		});

	return {
		attemptId: attempt.id,
		status: attempt.status,
		candidate: {
			id: attempt.candidate.id,
			name: attempt.candidate.user.name,
			email: attempt.candidate.user.email,
		},
		assessment: {
			id: attempt.assessment.id,
			title: attempt.assessment.title,
			description: attempt.assessment.description,
			durationMinutes: attempt.assessment.durationMinutes,
			totalMarks,
			passMarks: attempt.assessment.passMarks,
		},
		summary: {
			startedAt: attempt.startedAt,
			submittedAt: attempt.submittedAt,
			durationTakenMinutes,
			totalScore: attempt.totalScore,
			percentage,
			isPassed: attempt.isPassed,
			antiCheatFlags: attempt.antiCheatFlags,
			totalAnsweredQuestions: attempt.submissions.length,
			totalAssessmentQuestions: attempt.assessment.assessmentQuestions.length,
		},
		submissions: questionSubmissions,
	};
};

export const getMyAttempts = async (
	userId: string,
	query: { page?: number; limit?: number; status?: string },
) => {
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: Prisma.CandidateAttemptWhereInput = {
		candidateId: candidateProfile.id,
		deletedAt: null,
	};

	if (query.status) {
		whereConditions.status = query.status as any;
	}

	const total = await prisma.candidateAttempt.count({ where: whereConditions });
	const attempts = await prisma.candidateAttempt.findMany({
		where: whereConditions,
		skip,
		take: limit,
		orderBy: { createdAt: "desc" },
		include: {
			assessment: {
				select: {
					id: true,
					title: true,
					description: true,
					durationMinutes: true,
					passMarks: true,
					totalMarks: true,
					status: true,
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
		data: attempts,
	};
};

export const AttemptService = {
	startAttempt,
	getAttemptQuestions,
	submitAnswer,
	recordAntiCheatFlag,
	finishAttempt,
	getAttemptResult,
	getMyAttempts,
};
