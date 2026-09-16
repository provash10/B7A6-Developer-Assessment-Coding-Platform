import { z } from "zod";

const testCaseSchema = z.object({
	input: z.string().min(1, "Input is required"),
	expectedOutput: z.string().min(1, "Expected output is required"),
	isHidden: z.boolean().optional(),
});

const createQuestionZodSchema = z.object({
	body: z.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().min(1, "Description is required"),
		type: z.enum(["CODING", "MCQ", "DESCRIPTIVE"]),
		difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
		marks: z.number().positive("Marks must be a positive number").optional(),
		testCases: z.array(testCaseSchema).optional(),
		options: z.array(z.string()).optional(),
	}),
});

const updateQuestionZodSchema = z.object({
	body: z.object({
		title: z.string().min(1, "Title cannot be empty").optional(),
		description: z.string().min(1, "Description cannot be empty").optional(),
		type: z.enum(["CODING", "MCQ", "DESCRIPTIVE"]).optional(),
		difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
		marks: z.number().positive("Marks must be a positive number").optional(),
		testCases: z.array(testCaseSchema).optional(),
		options: z.array(z.string()).optional(),
	}),
});

export const QuestionValidation = {
	createQuestionZodSchema,
	updateQuestionZodSchema,
};
