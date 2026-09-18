import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

// Test or retrieve bKash token
router.get(
	"/bkash-token",
	checkAuth("ADMIN", "RECRUITER"),
	PaymentController.getBkashToken,
);

// Recruiter initiates payment to buy credits
router.post(
	"/initiate",
	checkAuth("RECRUITER"),
	validateRequest(PaymentValidation.initiatePaymentZodSchema),
	PaymentController.initiatePayment,
);

// bKash gateway callback endpoints (both GET and POST supported for redirect & webhook)
router.get("/callback", PaymentController.handlePaymentCallback);
router.post("/callback", PaymentController.handlePaymentCallback);

// User retrieves their own payment transactions
router.get(
	"/my-transactions",
	checkAuth("RECRUITER", "CANDIDATE"),
	PaymentController.getMyTransactions,
);

// Admin views all platform transactions
router.get(
	"/all-transactions",
	checkAuth("ADMIN"),
	PaymentController.getAllTransactions,
);

// Retrieve detailed transaction receipt
router.get(
	"/:id",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	PaymentController.getSingleTransaction,
);

export const PaymentRoutes = router;
