import { z } from "zod";

const questionAssignmentSchema = z.object({
	questionId: z.string().uuid("Invalid question ID"),
	orderIndex: z.number().int().positive().optional(),
});

const createAssessmentZodSchema = z.object({
	body: z.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().min(1, "Description is required"),
		durationMinutes: z
			.number()
			.positive("Duration must be a positive number of minutes"),
		passMarks: z.number().nonnegative("Pass marks must be 0 or greater"),
		startTime: z.string().datetime().optional(),
		endTime: z.string().datetime().optional(),
		questions: z.array(questionAssignmentSchema).optional(),
	}),
});

const updateAssessmentZodSchema = z.object({
	body: z.object({
		title: z.string().min(1, "Title cannot be empty").optional(),
		description: z.string().min(1, "Description cannot be empty").optional(),
		durationMinutes: z
			.number()
			.positive("Duration must be a positive number of minutes")
			.optional(),
		passMarks: z
			.number()
			.nonnegative("Pass marks must be 0 or greater")
			.optional(),
		status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
		startTime: z.string().datetime().optional(),
		endTime: z.string().datetime().optional(),
	}),
});

const addQuestionZodSchema = z.object({
	body: z.object({
		questionId: z.string().uuid("Invalid question ID"),
		orderIndex: z.number().int().positive().optional(),
	}),
});

export const AssessmentValidation = {
	createAssessmentZodSchema,
	updateAssessmentZodSchema,
	addQuestionZodSchema,
};
