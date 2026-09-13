import type { Request, Response } from "express";

const notFound = (req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		message: "API Route Not Found!",
		error: {
			path: req.originalUrl,
			message: "Your requested path is not found on this server",
		},
	});
};

export default notFound;
