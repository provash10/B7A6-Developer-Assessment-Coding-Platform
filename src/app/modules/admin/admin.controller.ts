import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

export const getDashboardStats = catchAsync(
	async (_req: Request, res: Response) => {
		// console.log("admin dashboard stats endpoint called");
		const result = await AdminService.getDashboardStats();

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Admin dashboard stats retrieved successfully",
			data: result,
		});
	},
);

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
	// console.log("admin audit logs endpoint called");
	const result = await AdminService.getAuditLogs(req.query);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Audit logs retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

export const AdminController = {
	getDashboardStats,
	getAuditLogs,
};
