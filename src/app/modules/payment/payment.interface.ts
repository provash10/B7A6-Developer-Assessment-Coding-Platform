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
}

export interface IInitiatePaymentResponse {
	transactionId: string;
	paymentUrl: string;
	amount: number;
	currency: string;
	credits: number;
	status: string;
}

export interface IPaymentCallbackQuery {
	paymentID?: string;
	status?: "success" | "failure" | "cancel" | string;
}

export interface IExecutePaymentResponse {
	transactionId: string;
	status: string;
	message: string;
	creditsPurchased?: number;
	newTotalCredits?: number;
	trxID?: string;
	amount?: number;
}

export interface IPaymentFilterParams {
	page?: string | number;
	limit?: string | number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	status?: string;
	provider?: string;
}
