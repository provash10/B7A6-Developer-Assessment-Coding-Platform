export interface IBkashTokenResponse {
	statusCode?: string;
	statusMessage?: string;
	id_token?: string;
	token_type?: string;
	expires_in?: number;
	refresh_token?: string;
}

export interface IInitiatePaymentPayload {
	credits: number;
	amount?: number;
}

export interface IPaymentCallbackQuery {
	paymentID?: string;
	status?: "success" | "failure" | "cancel" | string;
}

export interface IPaymentFilterParams {
	page?: string | number;
	limit?: string | number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	status?: string;
	provider?: string;
}
