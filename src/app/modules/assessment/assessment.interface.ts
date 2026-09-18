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

export interface ILeaderboardEntry {
	rank: number;
	attemptId: string;
	candidateId: string;
	candidateName: string;
	candidateEmail: string;
	totalScore: number;
	percentage: number;
	isPassed: boolean;
	durationMinutesTaken: number;
	submittedAt: Date | null;
	antiCheatFlags: number;
}

export interface IAssessmentAnalytics {
	assessmentId: string;
	assessmentTitle: string;
	totalInvitations: number;
	totalAttempts: number;
	totalSubmittedAttempts: number;
	totalPassed: number;
	totalFailed: number;
	passRatePercentage: number;
	averageScore: number;
	highestScore: number;
	lowestScore: number;
	totalMarks: number;
	passMarks: number;
}
