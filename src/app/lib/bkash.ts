import config from "../config";
import AppError from "../utils/AppError";

interface IBkashGrantTokenResponse {
	statusCode?: string;
	statusMessage?: string;
	id_token?: string;
	token_type?: string;
	expires_in?: number;
	refresh_token?: string;
}

let cachedIdToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Generates and returns a valid bKash id_token.
 * Uses in-memory caching with TTL (1 hour) to prevent redundant token requests.
 */
export const getBkashIdToken = async (): Promise<string> => {
	const now = Date.now();

	// Return cached token if valid for at least 5 more minutes (300,000 ms)
	if (cachedIdToken && tokenExpiresAt - now > 300000) {
		return cachedIdToken;
	}

	try {
		const response = await fetch(
			`${config.bkash.base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash.username,
					password: config.bkash.password,
				},
				body: JSON.stringify({
					app_key: config.bkash.app_key,
					app_secret: config.bkash.app_secret,
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new AppError(
				500,
				`Failed to grant bKash token: ${response.status} ${errorText}`,
			);
		}

		const data = (await response.json()) as IBkashGrantTokenResponse;

		if (!data.id_token) {
			throw new AppError(
				500,
				data.statusMessage || "bKash Access Token Grant Failed",
			);
		}

		cachedIdToken = data.id_token;
		// default expires_in is 3600 seconds (1 hour)
		tokenExpiresAt = now + (data.expires_in || 3600) * 1000;

		return cachedIdToken;
	} catch (error: unknown) {
		if (error instanceof AppError) {
			throw error;
		}
		const message =
			error instanceof Error ? error.message : "bKash Token Grant Error";
		throw new AppError(500, `bKash Authentication Error: ${message}`);
	}
};

/**
 * Returns pre-configured headers required for bKash authenticated API calls (create, execute, query).
 */
export const getBkashAuthHeaders = async (): Promise<
	Record<string, string>
> => {
	const idToken = await getBkashIdToken();

	return {
		"Content-Type": "application/json",
		Accept: "application/json",
		Authorization: idToken,
		"X-App-Key": config.bkash.app_key,
	};
};
