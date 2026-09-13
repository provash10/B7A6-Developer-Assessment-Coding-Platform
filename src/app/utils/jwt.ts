import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";

export const createToken = (
	payload: Record<string, unknown>,
	secret: Secret,
	expiresIn: any,
): string => {
	const token = jwt.sign(payload, secret, {
		expiresIn,
	} as SignOptions);

	return token;
};

export const verifyToken = (token: string, secret: Secret): JwtPayload | string => {
	return jwt.verify(token, secret);
};

export const jwtUtils = {
	createToken,
	verifyToken,
};

export default jwtUtils;
