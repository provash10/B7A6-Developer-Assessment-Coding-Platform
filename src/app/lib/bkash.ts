import config from "../config";
import AppError from "../utils/AppError";
import { redisClient } from "./redis";

interface IBkashGrantTokenResponse {
	statusCode?: string;
	statusMessage?: string;
	id_token?: string;
	token_type?: string;
	expires_in?: number;
	refresh_token?: string;
}

const ID_TOKEN_KEY = "bkash:idToken";
const REFRESH_TOKEN_KEY = "bkash:refreshToken";

// generates and returns a valid bkash id_token cached in redis
export const getBkashIdToken = async (): Promise<string> => {
	try {
		let bkashIdToken = await redisClient.get(ID_TOKEN_KEY);
		const bkashIdTokenTTL = await redisClient.ttl(ID_TOKEN_KEY);

		const bkashRefreshToken = await redisClient.get(REFRESH_TOKEN_KEY);
		const bkashRefreshTokenTTL = await redisClient.ttl(REFRESH_TOKEN_KEY);

		// if id token is expired and valid refresh token exists
		if (
			(bkashIdTokenTTL <= 600 || !bkashIdToken) &&
			bkashRefreshToken &&
			bkashRefreshTokenTTL > 600
		) {
			const refreshTokenResponse = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						username: config.bkash_username,
						password: config.bkash_password,
					},
					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: bkashRefreshToken,
					}),
				},
			);

			if (!refreshTokenResponse.ok) {
				throw new AppError(500, "bKash Refresh Token Grant Failed");
			}

			const bkashRefreshTokenResult =
				(await refreshTokenResponse.json()) as IBkashGrantTokenResponse;
			bkashIdToken = bkashRefreshTokenResult.id_token as string;

			await redisClient.set(ID_TOKEN_KEY, bkashIdToken, {
				EX: 60 * 60,
			});

			return bkashIdToken;
		}

		// if id token is still valid with ttl remaining
		if (bkashIdToken && bkashIdTokenTTL > 600) {
			return bkashIdToken;
		}

		// otherwise grant a new pair of tokens
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
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

		// store id token in redis
		await redisClient.set(ID_TOKEN_KEY, data.id_token, {
			EX: 60 * 60,
		});

		// store refresh token in redis
		if (data.refresh_token) {
			await redisClient.set(REFRESH_TOKEN_KEY, data.refresh_token, {
				EX: 60 * 60 * 24 * 28,
			});
		}

		return data.id_token;
	} catch (error: unknown) {
		if (error instanceof AppError) {
			throw error;
		}
		const message =
			error instanceof Error ? error.message : "bKash Token Grant Error";
		throw new AppError(500, `bKash Authentication Error: ${message}`);
	}
};

// returns pre-configured headers required for bkash authenticated api calls
export const getBkashAuthHeaders = async (): Promise<
	Record<string, string>
> => {
	const idToken = await getBkashIdToken();

	return {
		"Content-Type": "application/json",
		Accept: "application/json",
		Authorization: idToken,
		"X-App-Key": config.bkash_app_key,
	};
};
