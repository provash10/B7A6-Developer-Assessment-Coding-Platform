import type { Request, Response } from "express";

export const notFound = (req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		statusCode: 404,
		message: "API Route Not Found!",
		errors: [
			{
				path: req.originalUrl,
				message: "The requested API endpoint does not exist on this server.",
			},
		],
		error: {
			path: req.originalUrl,
			message: "The requested API endpoint does not exist on this server.",
		},
	});
};

export default notFound;
