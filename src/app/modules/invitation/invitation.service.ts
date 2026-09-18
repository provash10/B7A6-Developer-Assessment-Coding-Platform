import crypto from "crypto";
import type { Prisma, UserRole } from "@prisma/client";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
	IInvitationFilterParams,
	ISendInvitationInput,
} from "./invitation.interface";

export const sendInvitation = async (
	userId: string,
	userRole: UserRole,
	payload: ISendInvitationInput,
) => {
	// console.log("send invitation called with user id:", userid, "user role:", userrole, "payload:", payload);

	// check if assessment exists and is not deleted
	// console.log("checking assessment existence for id:", payload.assessmentid);
	const assessment = await prisma.assessment.findFirst({
		where: { id: payload.assessmentId, deletedAt: null },
	});

	if (!assessment) {
		// console.log("assessment not found for id:", payload.assessmentid);
		throw new AppError(404, "Assessment not found.");
	}
	// console.log("found assessment:", assessment.id, "title:", assessment.title, "status:", assessment.status);

	// check recruiter profile and verify ownership if not admin
	if (userRole !== "ADMIN") {
		// console.log("user is not admin. verifying recruiter profile ownership for user id:", userid);
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});

		if (!recruiterProfile) {
			// console.log("recruiter profile not found for user id:", userid);
			throw new AppError(404, "Recruiter profile not found.");
		}
		// console.log("found recruiter profile:", recruiterprofile.id);

		if (assessment.recruiterId !== recruiterProfile.id) {
			// console.log("ownership mismatch: assessment recruiter id !== recruiter profile id");
			throw new AppError(
				403,
				"You do not have permission to send invitations for this assessment.",
			);
		}
		// console.log("recruiter ownership verified successfully");
	}

	// ensure assessment has assigned questions
	const assignedQuestionsCount = await prisma.assessmentQuestion.count({
		where: { assessmentId: payload.assessmentId },
	});

	if (assignedQuestionsCount === 0) {
		// console.log("assessment has no assigned questions. auto-attaching available question from bank");
		const firstQuestion = await prisma.question.findFirst({
			where: { deletedAt: null },
		});

		if (firstQuestion) {
			await prisma.assessmentQuestion.create({
				data: {
					assessmentId: payload.assessmentId,
					questionId: firstQuestion.id,
					orderIndex: 1,
				},
			});
			// console.log("auto-attached question to assessment:", firstquestion.id);
		}
	}

	// automatically publish assessment if it is draft
	if (assessment.status !== "PUBLISHED") {
		// console.log("assessment is not published. auto-publishing assessment");
		await prisma.assessment.update({
			where: { id: payload.assessmentId },
			data: { status: "PUBLISHED" },
		});
		// console.log("assessment auto-published successfully");
	}

	// check candidate user and profile existence
	// console.log("finding candidate user with email:", payload.candidateemail);
	const candidateUser = await prisma.user.findUnique({
		where: { email: payload.candidateEmail },
		include: { candidateProfile: true },
	});

	if (!candidateUser || candidateUser.deletedAt) {
		// console.log("candidate user not found or is deleted for email:", payload.candidateemail);
		throw new AppError(404, "Candidate with this email not found.");
	}
	// console.log("found user for candidate email:", candidateuser.id, "role:", candidateuser.role);

	if (candidateUser.role !== "CANDIDATE") {
		// console.log("target user role is not candidate. role is:", candidateuser.role);
		throw new AppError(400, "Invitations can only be sent to candidates.");
	}

	if (!candidateUser.candidateProfile) {
		// console.log("candidate profile missing for user id:", candidateuser.id);
		throw new AppError(404, "Candidate profile not found.");
	}

	const candidateId = candidateUser.candidateProfile.id;
	// console.log("found candidate profile id:", candidateid);

	// prevent duplicate active invitations
	// console.log("checking existing active invitation for assessment id:", payload.assessmentid, "candidate id:", candidateid);
	const existingInvitation = await prisma.assessmentInvitation.findFirst({
		where: {
			assessmentId: payload.assessmentId,
			candidateId,
			deletedAt: null,
			status: {
				in: ["PENDING", "ACCEPTED"],
			},
		},
	});

	if (existingInvitation) {
		// console.log("duplicate active invitation detected. existing invitation id:", existinginvitation.id, "status:", existinginvitation.status);
		throw new AppError(
			400,
			"An active invitation has already been sent to this candidate for this assessment.",
		);
	}
	// console.log("no active duplicate invitation found. proceeding with invitation creation");

	// generate unique invite token
	const inviteToken = crypto.randomUUID();
	// console.log("generated unique invite token:", invitetoken);

	// calculate expiry date
	const expiresInDays =
		payload.expiresInDays && payload.expiresInDays > 0
			? payload.expiresInDays
			: 7;
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + expiresInDays);
	// console.log("calculated expires at date:", expiresat);

	// create assessment invitation record in database
	// console.log("inserting assessment invitation record into database with status pending");
	const invitation = await prisma.assessmentInvitation.create({
		data: {
			assessmentId: payload.assessmentId,
			candidateId,
			inviteToken,
			status: "PENDING",
			expiresAt,
		},
		include: {
			assessment: {
				select: {
					id: true,
					title: true,
					durationMinutes: true,
				},
			},
			candidate: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});
	// console.log("assessment invitation created successfully in db:", invitation.id);

	// send invitation email to candidate in background
	// console.log("triggering invitation email to candidate:", candidateuser.email);
	sendEmail({
		to: candidateUser.email,
		subject: `You've been invited to: ${assessment.title}`,
		templateName: "assessment-invitation",
		templateData: {
			candidateName: candidateUser.name,
			assessmentTitle: assessment.title,
			durationMinutes: assessment.durationMinutes,
			inviteToken,
			expiresAt: expiresAt.toDateString(),
		},
	}).catch((error) => {
		// email failure should not break the invitation flow
		// console.log("error sending invitation email to candidate:", error);
		console.error("Failed to send invitation email:", error);
	});

	// console.log("send invitation completed successfully for invitation id:", invitation.id);
	return invitation;
};

export const getAllInvitations = async (
	userId: string,
	userRole: UserRole,
	query: IInvitationFilterParams,
) => {
	// console.log("get all invitations called by user id:", userid, "user role:", userrole, "query:", query);

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
	// console.log("pagination params computed - page:", page, "limit:", limit, "skip:", skip, "sort by:", sortby, "sort order:", sortorder);

	const andConditions: Prisma.AssessmentInvitationWhereInput[] = [
		{ deletedAt: null },
	];

	// if recruiter, only retrieve invitations for assessments owned by this recruiter
	if (userRole !== "ADMIN") {
		// console.log("user is recruiter. fetching recruiter profile for user id:", userid);
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});

		if (!recruiterProfile) {
			// console.log("recruiter profile not found for user id:", userid);
			throw new AppError(404, "Recruiter profile not found.");
		}

		// console.log("scoping invitations to recruiter id:", recruiterprofile.id);
		andConditions.push({
			assessment: {
				recruiterId: recruiterProfile.id,
			},
		});
	} else {
		// console.log("user is admin. global view across all recruiter assessments");
	}

	if (query.status) {
		// console.log("adding status filter:", query.status);
		andConditions.push({ status: query.status });
	}

	if (query.assessmentId) {
		// console.log("adding assessment id filter:", query.assessmentid);
		andConditions.push({ assessmentId: query.assessmentId });
	}

	if (query.searchTerm) {
		// console.log("adding search filter for keyword:", query.searchterm);
		andConditions.push({
			OR: [
				{
					assessment: {
						title: { contains: query.searchTerm, mode: "insensitive" },
					},
				},
				{
					candidate: {
						user: {
							name: { contains: query.searchTerm, mode: "insensitive" },
						},
					},
				},
				{
					candidate: {
						user: {
							email: { contains: query.searchTerm, mode: "insensitive" },
						},
					},
				},
			],
		});
	}

	// console.log("counting total invitations matching conditions");
	const total = await prisma.assessmentInvitation.count({
		where: { AND: andConditions },
	});
	// console.log("total invitations found in database:", total);

	// console.log("executing find many for invitations with skip:", skip, "take:", limit);
	const invitations = await prisma.assessmentInvitation.findMany({
		where: { AND: andConditions },
		skip,
		take: limit,
		orderBy: { [sortBy]: sortOrder },
		include: {
			assessment: {
				select: {
					id: true,
					title: true,
					durationMinutes: true,
					totalMarks: true,
					passMarks: true,
					status: true,
				},
			},
			candidate: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});

	// console.log("successfully retrieved invitations. batch size:", invitations.length, "total:", total);
	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: invitations,
	};
};

export const getMyInvitations = async (
	userId: string,
	query: IInvitationFilterParams,
) => {
	// console.log("get my invitations called for candidate user id:", userid, "query:", query);

	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
	// console.log("candidate pagination params - page:", page, "limit:", limit, "skip:", skip, "sort by:", sortby, "sort order:", sortorder);

	// console.log("fetching candidate profile for user id:", userid);
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		// console.log("candidate profile not found for user id:", userid);
		throw new AppError(404, "Candidate profile not found.");
	}

	// console.log("found candidate profile id:", candidateprofile.id);
	const andConditions: Prisma.AssessmentInvitationWhereInput[] = [
		{ candidateId: candidateProfile.id },
		{ deletedAt: null },
	];

	if (query.status) {
		// console.log("filtering candidate invitations by status:", query.status);
		andConditions.push({ status: query.status });
	}

	if (query.searchTerm) {
		// console.log("filtering candidate invitations by assessment title containing:", query.searchterm);
		andConditions.push({
			assessment: {
				title: { contains: query.searchTerm, mode: "insensitive" },
			},
		});
	}

	// console.log("counting total invitations for candidate id:", candidateprofile.id);
	const total = await prisma.assessmentInvitation.count({
		where: { AND: andConditions },
	});
	// console.log("total invitations for candidate:", total);

	// console.log("executing find many for candidate invitations with skip:", skip, "take:", limit);
	const invitations = await prisma.assessmentInvitation.findMany({
		where: { AND: andConditions },
		skip,
		take: limit,
		orderBy: { [sortBy]: sortOrder },
		include: {
			assessment: {
				select: {
					id: true,
					title: true,
					description: true,
					durationMinutes: true,
					totalMarks: true,
					passMarks: true,
					status: true,
					startTime: true,
					endTime: true,
					recruiter: {
						select: {
							companyName: true,
						},
					},
				},
			},
		},
	});

	// console.log("successfully fetched candidate invitations. count:", invitations.length, "total:", total);
	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: invitations,
	};
};

export const getSingleInvitation = async (
	id: string,
	userId: string,
	userRole: UserRole,
) => {
	// console.log("get single invitation called with id:", id, "user id:", userid, "user role:", userrole);

	// find invitation by id and ensure not deleted
	// console.log("querying database for invitation id:", id);
	const invitation = await prisma.assessmentInvitation.findFirst({
		where: {
			id,
			deletedAt: null,
		},
		include: {
			assessment: {
				select: {
					id: true,
					recruiterId: true,
					title: true,
					description: true,
					durationMinutes: true,
					passMarks: true,
					totalMarks: true,
					status: true,
					startTime: true,
					endTime: true,
				},
			},
			candidate: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});

	if (!invitation) {
		// console.log("invitation not found for id:", id);
		throw new AppError(404, "Invitation not found.");
	}
	// console.log("found invitation:", invitation.id, "candidate id:", invitation.candidateid, "assessment id:", invitation.assessmentid);

	// enforce role based access control
	if (userRole === "CANDIDATE") {
		// console.log("user is candidate. checking candidate profile ownership");
		const candidateProfile = await prisma.candidateProfile.findUnique({
			where: { userId },
		});

		if (!candidateProfile || candidateProfile.id !== invitation.candidateId) {
			// console.log("candidate profile mismatch or not found for candidate id:", invitation.candidateid);
			throw new AppError(
				403,
				"Forbidden. You do not have permission to view this invitation.",
			);
		}
		// console.log("candidate ownership verified successfully");
	} else if (userRole === "RECRUITER") {
		// console.log("user is recruiter. checking assessment recruiter ownership");
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});

		if (
			!recruiterProfile ||
			recruiterProfile.id !== invitation.assessment.recruiterId
		) {
			// console.log("recruiter mismatch: recruiter profile id !== assessment recruiter id");
			throw new AppError(
				403,
				"Forbidden. You do not have permission to view this invitation.",
			);
		}
		// console.log("recruiter ownership verified successfully");
	} else {
		// console.log("user is admin. global access granted");
	}

	// console.log("get single invitation completed successfully for id:", id);
	return invitation;
};

export const acceptInvitation = async (invitationId: string, userId: string) => {
	// console.log("accept invitation called with invitation id:", invitationid, "user id:", userid);

	// fetch candidate profile for logged in user
	// console.log("fetching candidate profile for user id:", userid);
	const candidateProfile = await prisma.candidateProfile.findUnique({
		where: { userId },
	});

	if (!candidateProfile) {
		// console.log("candidate profile not found for user id:", userid);
		throw new AppError(404, "Candidate profile not found.");
	}
	// console.log("found candidate profile id:", candidateprofile.id);

	// fetch invitation from database
	// console.log("fetching invitation with id:", invitationid);
	const invitation = await prisma.assessmentInvitation.findFirst({
		where: {
			id: invitationId,
			deletedAt: null,
		},
		include: {
			assessment: true,
		},
	});

	if (!invitation) {
		// console.log("invitation not found for id:", invitationid);
		throw new AppError(404, "Invitation not found.");
	}
	// console.log("found invitation:", invitation.id, "status:", invitation.status, "expires at:", invitation.expiresat);

	// verify invitation ownership
	if (invitation.candidateId !== candidateProfile.id) {
		// console.log("invitation ownership mismatch: invitation candidate id !== candidate profile id");
		throw new AppError(403, "This invitation does not belong to you.");
	}
	// console.log("invitation ownership confirmed");

	// check if already accepted
	if (invitation.status === "ACCEPTED") {
		// console.log("invitation was already accepted previously:", invitation.id);
		throw new AppError(400, "Invitation has already been accepted.");
	}

	// check if invitation has expired
	const now = new Date();
	if (now > new Date(invitation.expiresAt) || invitation.status === "EXPIRED") {
		// console.log("invitation has expired. expiry time:", invitation.expiresat, "current time:", now);
		if (invitation.status !== "EXPIRED") {
			// console.log("updating invitation status to expired in database");
			await prisma.assessmentInvitation.update({
				where: { id: invitationId },
				data: { status: "EXPIRED" },
			});
		}
		throw new AppError(400, "Invitation has expired.");
	}
	// console.log("invitation validity and expiry check passed");

	// check existing candidate attempt to prevent duplicate attempts
	// console.log("checking if candidate attempt already exists for assessment id:", invitation.assessmentid);
	const existingAttempt = await prisma.candidateAttempt.findFirst({
		where: {
			assessmentId: invitation.assessmentId,
			candidateId: candidateProfile.id,
			deletedAt: null,
		},
	});

	if (existingAttempt) {
		// console.log("existing attempt found with id:", existingattempt.id, "status:", existingattempt.status);
		const updatedInvitation = await prisma.assessmentInvitation.update({
			where: { id: invitationId },
			data: { status: "ACCEPTED" },
		});
		return {
			invitation: updatedInvitation,
			attempt: existingAttempt,
		};
	}

	// execute transaction: mark invitation accepted and create candidate attempt
	// console.log("starting prisma transaction for accepting invitation and creating candidate attempt");
	const result = await prisma.$transaction(async (tx) => {
		// console.log("updating invitation status to accepted");
		const updatedInvitation = await tx.assessmentInvitation.update({
			where: { id: invitationId },
			data: { status: "ACCEPTED" },
		});

		// console.log("creating new candidate attempt with status not started");
		const newAttempt = await tx.candidateAttempt.create({
			data: {
				assessmentId: invitation.assessmentId,
				candidateId: candidateProfile.id,
				status: "NOT_STARTED",
			},
		});

		// console.log("created candidate attempt id:", newattempt.id);
		return {
			invitation: updatedInvitation,
			attempt: newAttempt,
		};
	});

	// console.log("accept invitation transaction finished successfully");
	return result;
};

export const deleteInvitation = async (
	invitationId: string,
	userId: string,
	userRole: UserRole,
) => {
	// console.log("delete invitation called with invitation id:", invitationid, "user id:", userid, "user role:", userrole);

	// fetch invitation with assessment info
	// console.log("fetching invitation to delete with id:", invitationid);
	const invitation = await prisma.assessmentInvitation.findFirst({
		where: {
			id: invitationId,
			deletedAt: null,
		},
		include: {
			assessment: true,
		},
	});

	if (!invitation) {
		// console.log("invitation not found for deletion with id:", invitationid);
		throw new AppError(404, "Invitation not found.");
	}
	// console.log("found invitation for deletion:", invitation.id, "current status:", invitation.status);

	// ownership verification for recruiter
	if (userRole !== "ADMIN") {
		// console.log("user is recruiter. checking recruiter profile ownership");
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});

		if (
			!recruiterProfile ||
			recruiterProfile.id !== invitation.assessment.recruiterId
		) {
			// console.log("recruiter mismatch for invitation deletion");
			throw new AppError(
				403,
				"You do not have permission to delete this invitation.",
			);
		}
		// console.log("recruiter ownership verified for deletion");
	} else {
		// console.log("user is admin. permission granted for deletion");
	}

	// business rule: do not allow deletion of already accepted invitations
	if (invitation.status === "ACCEPTED") {
		// console.log("cannot delete accepted invitation with id:", invitationid);
		throw new AppError(
			400,
			"Cannot delete an invitation that has already been accepted.",
		);
	}

	// perform soft delete
	// console.log("performing soft delete on invitation with id:", invitationid);
	const deletedInvitation = await prisma.assessmentInvitation.update({
		where: { id: invitationId },
		data: {
			deletedAt: new Date(),
		},
	});

	// console.log("invitation soft deleted successfully:", deletedinvitation.id);
	return deletedInvitation;
};

export const InvitationService = {
	sendInvitation,
	getAllInvitations,
	getMyInvitations,
	getSingleInvitation,
	acceptInvitation,
	deleteInvitation,
};
