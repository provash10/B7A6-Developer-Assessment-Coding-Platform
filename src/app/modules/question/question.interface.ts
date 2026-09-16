import type { QuestionDifficulty, QuestionType } from "@prisma/client";

export interface ITestCase {
	input: string;
	expectedOutput: string;
	isHidden?: boolean;
}

export interface ICreateQuestionInput {
	title: string;
	description: string;
	type: QuestionType;
	difficulty?: QuestionDifficulty;
	marks?: number;
	testCases?: ITestCase[] | Record<string, unknown> | unknown;
	options?: string[] | Record<string, unknown> | unknown;
}

export interface IUpdateQuestionInput {
	title?: string;
	description?: string;
	type?: QuestionType;
	difficulty?: QuestionDifficulty;
	marks?: number;
	testCases?: ITestCase[] | Record<string, unknown> | unknown;
	options?: string[] | Record<string, unknown> | unknown;
}

export interface IQuestionFilterParams {
	page?: number;
	limit?: number;
	searchTerm?: string;
	type?: QuestionType;
	difficulty?: QuestionDifficulty;
	minMarks?: number;
	maxMarks?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
