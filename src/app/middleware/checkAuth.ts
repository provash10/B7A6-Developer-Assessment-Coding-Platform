import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import config from "../config";
import { prisma } from "../lib/prisma";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import jwtUtils from "../utils/jwt";

export interface RequestUser {
	userId: string;
	email: string;
	name: string;
	role: UserRole;
}

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}

export const checkAuth = (...requiredRoles: UserRole[]) => {
	return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
		const token = req.cookies?.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw new AppError(
				401,
				"You are not logged in. Please log in to access this resource.",
			);
		}

		let decodedPayload: JwtPayload;
		try {
			decodedPayload = jwtUtils.verifyToken(
				token,
				config.jwt.jwt_secret,
			) as JwtPayload;
		} catch (err: any) {
			throw new AppError(401, "Invalid or expired authorization token.");
		}

		const { userId, email, role } = decodedPayload;

		if (requiredRoles.length && !requiredRoles.includes(role as UserRole)) {
			throw new AppError(
				403,
				"Forbidden. You do not have permission to access this resource.",
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user || user.deletedAt) {
			throw new AppError(401, "User no longer exists or account is inactive.");
		}

		req.user = {
			userId: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		};

		next();
	});
};

export default checkAuth;
