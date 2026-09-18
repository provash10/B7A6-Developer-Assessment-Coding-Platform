import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

// Test or retrieve bKash token
router.get(
	"/bkash-token",
	checkAuth("ADMIN", "RECRUITER"),
	PaymentController.getBkashToken,
);

export const PaymentRoutes = router;
