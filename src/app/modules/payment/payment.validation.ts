import { z } from "zod";

const initiatePaymentZodSchema = z.object({
	body: z.object({
		credits: z
			.number()
			.int("Credits must be an integer")
			.min(10, "Minimum purchase is 10 credits"),
	}),
});

export const PaymentValidation = {
	initiatePaymentZodSchema,
};
