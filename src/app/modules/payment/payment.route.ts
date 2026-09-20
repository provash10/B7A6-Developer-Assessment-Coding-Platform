import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

// test or retrieve bkash token
router.get(
	"/bkash-token",
	checkAuth("ADMIN", "RECRUITER"),
	PaymentController.getBkashToken,
);

// recruiter initiates payment to buy credits
router.post(
	"/initiate",
	checkAuth("RECRUITER"),
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
