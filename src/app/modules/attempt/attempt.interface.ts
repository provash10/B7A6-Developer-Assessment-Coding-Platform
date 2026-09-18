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

export interface IAntiCheatResponse {
	attemptId: string;
	antiCheatFlags: number;
	message: string;
}

export interface IFinishAttemptResponse {
	attemptId: string;
	assessmentId: string;
	assessmentTitle: string;
	status: string;
	startedAt: Date | null;
	submittedAt: Date;
	totalScore: number;
	totalMarks: number;
	passMarks: number;
	percentage: number;
	isPassed: boolean;
	antiCheatFlags: number;
}

export interface IQuestionResultDetail {
	questionId: string;
	orderIndex: number;
	title: string;
	type: string;
	maxMarks: number;
	scoreObtained: number;
	verdict: string | null;
	selectedOption?: string | null;
	submittedCode?: string | null;
	executionTime?: number | null;
}

export interface IAttemptResultResponse {
	attemptId: string;
	status: string;
	candidate: {
		id: string;
		name: string;
		email: string;
	};
	assessment: {
		id: string;
		title: string;
		description: string;
		durationMinutes: number;
		totalMarks: number;
		passMarks: number;
	};
	summary: {
		startedAt: Date | null;
		submittedAt: Date | null;
		durationTakenMinutes: number;
		totalScore: number;
		percentage: number;
		isPassed: boolean;
		antiCheatFlags: number;
		totalAnsweredQuestions: number;
		totalAssessmentQuestions: number;
	};
	submissions: IQuestionResultDetail[];
}
