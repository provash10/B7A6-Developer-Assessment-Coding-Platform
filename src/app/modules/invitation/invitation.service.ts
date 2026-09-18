import crypto from "crypto";
import type { UserRole } from "@prisma/client";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type { ISendInvitationInput } from "./invitation.interface";

export const sendInvitation = async (
	userId: string,
	userRole: UserRole,
	payload: ISendInvitationInput,
) => {
	//  Check if assessment exists and is not deleted
	const assessment = await prisma.assessment.findFirst({
		where: { id: payload.assessmentId, deletedAt: null },
	});

	if (!assessment) {
		throw new AppError(404, "Assessment not found.");
	}

	// Check recruiter profile and verify ownership if not ADMIN
	if (userRole !== "ADMIN") {
		const recruiterProfile = await prisma.recruiterProfile.findUnique({
			where: { userId },
		});

		if (!recruiterProfile) {
			throw new AppError(404, "Recruiter profile not found.");
		}

		if (assessment.recruiterId !== recruiterProfile.id) {
			throw new AppError(
				403,
				"You do not have permission to send invitations for this assessment.",
			);
		}
	}

	// Check if assessment is PUBLISHED
	if (assessment.status !== "PUBLISHED") {
		throw new AppError(
			400,
			"Cannot send invitation for an assessment that is not published.",
		);
	}

	// Check candidate user and profile existence
	const candidateUser = await prisma.user.findUnique({
		where: { email: payload.candidateEmail },
		include: { candidateProfile: true },
	});

	if (!candidateUser || candidateUser.deletedAt) {
		throw new AppError(404, "Candidate with this email not found.");
	}

	if (candidateUser.role !== "CANDIDATE") {
		throw new AppError(400, "Invitations can only be sent to candidates.");
	}

	if (!candidateUser.candidateProfile) {
		throw new AppError(404, "Candidate profile not found.");
	}

	const candidateId = candidateUser.candidateProfile.id;

	//  Prevent duplicate active invitations
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
		throw new AppError(
			400,
			"An active invitation has already been sent to this candidate for this assessment.",
		);
	}

	// Generate unique invite token
	const inviteToken = crypto.randomUUID();

	// 7. Calculate expiry date (default 7 days)
	const expiresInDays =
		payload.expiresInDays && payload.expiresInDays > 0
			? payload.expiresInDays
			: 7;
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + expiresInDays);

	// Create AssessmentInvitation record in database
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

	// Send invitation email to candidate in background (non-blocking)
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
		// Email failure should not break the invitation flow
		console.error("Failed to send invitation email:", error);
	});

	return invitation;
};

export const InvitationService = {
	sendInvitation,
};
