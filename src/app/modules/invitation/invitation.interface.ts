import type { InvitationStatus } from "@prisma/client";

export interface ISendInvitationInput {
	assessmentId: string;
	candidateEmail: string;
	expiresInDays?: number;
}

export interface IInvitationFilterParams {
	page?: number | string;
	limit?: number | string;
	status?: InvitationStatus;
	assessmentId?: string;
	searchTerm?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
