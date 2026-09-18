import { z } from "zod";

const submitAnswerZodSchema = z.object({
	body: z
		.object({
			questionId: z.string().min(1, "Question ID is required"),
			selectedOption: z.string().optional(),
			submittedCode: z.string().optional(),
		})
		.refine(
			(data) =>
				data.selectedOption !== undefined || data.submittedCode !== undefined,
			{
				message: "Either selectedOption or submittedCode must be provided",
			},
		),
});

export const AttemptValidation = {
	submitAnswerZodSchema,
};
