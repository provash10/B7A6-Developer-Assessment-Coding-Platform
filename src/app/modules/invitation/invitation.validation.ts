import { z } from "zod";

// console.log("initializing invitation validation schemas");

const sendInvitationZodSchema = z.object({
	body: z.object({
		assessmentId: z.string().uuid("Invalid assessment ID format"),
		candidateEmail: z.string().email("Invalid candidate email address"),
		expiresInDays: z
			.number()
			.int("Expires in days must be an integer")
			.positive("Expires in days must be greater than 0")
			.optional(),
	}),
});

export const InvitationValidation = {
	sendInvitationZodSchema,
};
