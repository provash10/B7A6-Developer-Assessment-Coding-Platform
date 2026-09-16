import type { AssessmentStatus } from "@prisma/client";

export interface IQuestionAssignmentInput {
	questionId: string;
	orderIndex?: number;
}

export interface ICreateAssessmentInput {
	title: string;
	description: string;
	durationMinutes: number;
	passMarks: number;
	startTime?: string | Date;
	endTime?: string | Date;
	questions?: IQuestionAssignmentInput[];
}

export interface IUpdateAssessmentInput {
	title?: string;
	description?: string;
	durationMinutes?: number;
	passMarks?: number;
	status?: AssessmentStatus;
	startTime?: string | Date;
	endTime?: string | Date;
}

export interface IAssessmentFilterParams {
	page?: number;
	limit?: number;
	searchTerm?: string;
	status?: AssessmentStatus;
	recruiterId?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IAddQuestionToAssessmentInput {
	questionId: string;
	orderIndex?: number;
}
