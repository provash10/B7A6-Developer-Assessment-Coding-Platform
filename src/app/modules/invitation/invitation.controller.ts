import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InvitationService } from "./invitation.service";

export const sendInvitation = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as any;
		// console.log("controller: send invitation called by user id:", userid, "role:", userrole, "payload:", req.body);

		const result = await InvitationService.sendInvitation(
			userId,
			userRole,
			req.body,
		);

		// console.log("controller: send invitation completed with result id:", result.id);
		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Invitation sent successfully",
			data: result,
		});
	},
);

export const getAllInvitations = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as any;
		// console.log("controller: get all invitations called by user id:", userid, "role:", userrole, "query:", req.query);

		const result = await InvitationService.getAllInvitations(
			userId,
			userRole,
			req.query,
		);

		// console.log("controller: get all invitations retrieved total items:", result.meta.total);
		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Invitations retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getMyInvitations = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;
		// console.log("controller: get my invitations called for candidate user id:", userid, "query:", req.query);

		const result = await InvitationService.getMyInvitations(userId, req.query);

		// console.log("controller: get my invitations retrieved total items:", result.meta.total);
		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "My invitations retrieved successfully",
			meta: result.meta,
			data: result.data,
		});
	},
);

export const getSingleInvitation = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as any;
		// console.log("controller: get single invitation called for id:", id, "user id:", userid, "role:", userrole);

		const result = await InvitationService.getSingleInvitation(
			id as string,
			userId,
			userRole,
		);

		// console.log("controller: get single invitation successfully retrieved invitation id:", result.id);
		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Invitation retrieved successfully",
			data: result,
		});
	},
);

export const acceptInvitation = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const userId = req.user?.userId as string;
		// console.log("controller: accept invitation called for invitation id:", id, "user id:", userid);

		const result = await InvitationService.acceptInvitation(
			id as string,
			userId,
		);

		// console.log("controller: accept invitation completed with attempt id:", result.attempt?.id);
		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Invitation accepted successfully",
			data: result,
		});
	},
);

export const deleteInvitation = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const userId = req.user?.userId as string;
		const userRole = req.user?.role as any;
		// console.log("controller: delete invitation called for invitation id:", id, "user id:", userid, "role:", userrole);

		const result = await InvitationService.deleteInvitation(
			id as string,
			userId,
			userRole,
		);

		// console.log("controller: delete invitation completed for id:", result.id);
		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Invitation deleted successfully",
			data: result,
		});
	},
);

export const InvitationController = {
	sendInvitation,
	getAllInvitations,
	getMyInvitations,
	getSingleInvitation,
	acceptInvitation,
	deleteInvitation,
};
