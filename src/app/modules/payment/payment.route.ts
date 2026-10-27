import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { PaymentController } from "./payment.controller.js";
import { PaymentValidation } from "./payment.validation.js";

const router = Router();

// test or retrieve bkash token
router.get(
	"/bkash-token",
	checkAuth("ADMIN", "RECRUITER"),
	PaymentController.getBkashToken,
);

// initiates payment to buy credits (open to all authenticated users)
router.post(
	"/initiate",
	checkAuth("RECRUITER", "CANDIDATE", "ADMIN"),
	validateRequest(PaymentValidation.initiatePaymentZodSchema),
	PaymentController.initiatePayment,
);

// bkash gateway callback endpoints (both get and post supported for redirect & webhook)
router.get("/callback", PaymentController.handlePaymentCallback);
router.post("/callback", PaymentController.handlePaymentCallback);

// user retrieves their own payment transactions
router.get(
	"/my-transactions",
	checkAuth("RECRUITER", "CANDIDATE"),
	PaymentController.getMyTransactions,
);

// admin views all platform transactions
router.get(
	"/all-transactions",
	checkAuth("ADMIN"),
	PaymentController.getAllTransactions,
);

// retrieve detailed transaction receipt
router.get(
	"/:id",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	PaymentController.getSingleTransaction,
);

export const PaymentRoutes = router;
