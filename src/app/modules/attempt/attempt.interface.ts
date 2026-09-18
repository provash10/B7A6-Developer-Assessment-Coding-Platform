export interface IStartAttemptResponse {
	attemptId: string;
	assessmentId: string;
	assessmentTitle: string;
	durationMinutes: number;
	startedAt: Date;
	expiresAt: Date;
	status: string;
}

export interface ISanitizedQuestion {
	id: string;
	orderIndex: number;
	title: string;
	description: string;
	type: "CODING" | "MCQ" | "DESCRIPTIVE";
	difficulty: "EASY" | "MEDIUM" | "HARD";
	marks: number;
	options?: unknown;
	testCases?: unknown;
	currentSubmission?: {
		selectedOption?: string | null;
		submittedCode?: string | null;
		verdict?: string | null;
		scoreObtained?: number;
	} | null;
}

export interface IExamQuestionsResponse {
	attemptId: string;
	assessmentId: string;
	assessmentTitle: string;
	durationMinutes: number;
	startedAt: Date;
	expiresAt: Date;
	timeRemainingSeconds: number;
	totalQuestions: number;
	questions: ISanitizedQuestion[];
}

export interface ISubmitAnswerInput {
	questionId: string;
	selectedOption?: string;
	submittedCode?: string;
}

export interface ISubmissionResultResponse {
	submissionId: string;
	attemptId: string;
	questionId: string;
	selectedOption?: string | null;
	submittedCode?: string | null;
	verdict: string;
	scoreObtained: number;
	executionTime?: number | null;
	submittedAt: Date;
}
