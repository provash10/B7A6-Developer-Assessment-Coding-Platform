import { getBkashIdToken } from "../../lib/bkash";

/**
 * Step 1: getBkashToken
 * Retrieves a secure authentication id_token from bKash server using credentials.
 * Automatically utilizes in-memory TTL caching to avoid redundant calls.
 */
export const getBkashToken = async (): Promise<string> => {
	const token = await getBkashIdToken();
	return token;
};

export const PaymentService = {
	getBkashToken,
};
