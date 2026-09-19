import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
	ICreateQuestionInput,
	IQuestionFilterParams,
	IUpdateQuestionInput,
} from "./question.interface";

export const createQuestion = async (payload: ICreateQuestionInput) => {
	const question = await prisma.question.create({
		data: {
			title: payload.title,
			description: payload.description,
			type: payload.type,
			difficulty: payload.difficulty ?? "MEDIUM",
			marks: payload.marks ?? 10,
			testCases: payload.testCases
				? (payload.testCases as Prisma.InputJsonValue)
				: undefined,
			options: payload.options
				? (payload.options as Prisma.InputJsonValue)
				: undefined,
		},
	});

	return question;
};

export const getAllQuestions = async (query: IQuestionFilterParams) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: Prisma.QuestionWhereInput = {
		deletedAt: null,
	};

	if (query.searchTerm) {
		whereConditions.OR = [
			{ title: { contains: query.searchTerm, mode: "insensitive" } },
			{ description: { contains: query.searchTerm, mode: "insensitive" } },
		];
	}

	if (query.type) {
		whereConditions.type = query.type;
	}

	if (query.difficulty) {
		whereConditions.difficulty = query.difficulty;
	}

	if (query.minMarks !== undefined || query.maxMarks !== undefined) {
		whereConditions.marks = {};
		if (query.minMarks !== undefined) {
			whereConditions.marks.gte = Number(query.minMarks);
		}
		if (query.maxMarks !== undefined) {
			whereConditions.marks.lte = Number(query.maxMarks);
		}
	}

	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	const total = await prisma.question.count({ where: whereConditions });
	const questions = await prisma.question.findMany({
		where: whereConditions,
		skip,
		take: limit,
		orderBy: { [sortBy]: sortOrder },
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: questions,
	};
};

export const getQuestionById = async (id: string) => {
	const question = await prisma.question.findFirst({
		where: {
			id,
			deletedAt: null,
		},
	});

	if (!question) {
		throw new AppError(404, "Question not found.");
	}

	return question;
};

export const updateQuestion = async (
	id: string,
	payload: IUpdateQuestionInput,
) => {
	const existingQuestion = await prisma.question.findFirst({
		where: {
			id,
			deletedAt: null,
		},
	});

	if (!existingQuestion) {
		throw new AppError(404, "Question not found.");
	}

	const updatedQuestion = await prisma.question.update({
		where: { id },
		data: {
			...(payload.title !== undefined && { title: payload.title }),
			...(payload.description !== undefined && {
				description: payload.description,
			}),
			...(payload.type !== undefined && { type: payload.type }),
			...(payload.difficulty !== undefined && {
				difficulty: payload.difficulty,
			}),
			...(payload.marks !== undefined && { marks: payload.marks }),
			...(payload.testCases !== undefined && {
				testCases: payload.testCases as Prisma.InputJsonValue,
			}),
			...(payload.options !== undefined && {
				options: payload.options as Prisma.InputJsonValue,
			}),
		},
	});

	return updatedQuestion;
};

export const deleteQuestion = async (id: string) => {
	const existingQuestion = await prisma.question.findFirst({
		where: {
			id,
			deletedAt: null,
		},
	});

	if (!existingQuestion) {
		throw new AppError(404, "Question not found or already deleted.");
	}

	const deletedQuestion = await prisma.question.update({
		where: { id },
		data: {
			deletedAt: new Date(),
		},
	});

	return deletedQuestion;
};

export const QuestionService = {
	createQuestion,
	getAllQuestions,
	getQuestionById,
	updateQuestion,
	deleteQuestion,
};
