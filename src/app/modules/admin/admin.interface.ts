export interface IDashboardStatsResponse {
	users: {
		totalUsers: number;
		totalCandidates: number;
		totalRecruiters: number;
		totalAdmins: number;
	};
	content: {
		totalAssessments: number;
		totalQuestions: number;
	};
	attempts: {
		totalAttempts: number;
		totalSubmitted: number;
		totalPassed: number;
		totalFailed: number;
		passRatePercentage: number;
	};
	revenue: {
		totalRevenue: number;
		totalSuccessfulPayments: number;
		currency: string;
	};
}

export interface IAuditLogFilterParams {
	page?: number;
	limit?: number;
	searchTerm?: string;
	action?: string;
	entityType?: string;
	userId?: string;
	startDate?: string;
	endDate?: string;
}

export interface ICreateAuditLogPayload {
	userId: string;
	action: string;
	entityType: string;
	entityId: string;
	oldValue?: any;
	newValue?: any;
	ipAddress?: string;
}
