import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { InvitationController } from "./invitation.controller";
import { InvitationValidation } from "./invitation.validation";

const router = Router();

// console.log("configuring invitation routes");

// send invitation to candidate
// console.log("registering route: post /api/invitations");
router.post(
	"/",
	checkAuth("ADMIN", "RECRUITER"),
	validateRequest(InvitationValidation.sendInvitationZodSchema),
	InvitationController.sendInvitation,
);

// get all invitations (scoped for recruiter, global for admin)
// console.log("registering route: get /api/invitations");
router.get(
	"/",
	checkAuth("ADMIN", "RECRUITER"),
	InvitationController.getAllInvitations,
);

// get candidate personal invitations (must be placed before id)
// console.log("registering route: get /api/invitations/my");
router.get(
	"/my",
	checkAuth("CANDIDATE"),
	InvitationController.getMyInvitations,
);

// get a single invitation by id
// console.log("registering route: get /api/invitations/id");
router.get(
	"/:id",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	InvitationController.getSingleInvitation,
);

// candidate accepts invitation and initializes candidate attempt
// console.log("registering route: patch /api/invitations/id/accept");
router.patch(
	"/:id/accept",
	checkAuth("CANDIDATE"),
	InvitationController.acceptInvitation,
);

// delete or cancel invitation (soft delete)
// console.log("registering route: delete /api/invitations/id");
router.delete(
	"/:id",
	checkAuth("ADMIN", "RECRUITER"),
	InvitationController.deleteInvitation,
);

export const InvitationRoutes = router;
