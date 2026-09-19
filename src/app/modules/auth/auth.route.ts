import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	validateRequest(AuthValidation.registerSchema),
	AuthController.register,
);

router.post(
	"/login",
	validateRequest(AuthValidation.loginSchema),
	AuthController.login,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

router.post(
	"/change-password",
	checkAuth(),
	validateRequest(AuthValidation.changePasswordSchema),
	AuthController.changePassword,
);

router.post(
	"/forgot-password",
	validateRequest(AuthValidation.forgotPasswordSchema),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(AuthValidation.resetPasswordSchema),
	AuthController.resetPassword,
);

router.post(
	"/google",
	validateRequest(AuthValidation.googleLoginSchema),
	AuthController.googleLogin,
);

router.post(
	"/google-login",
	validateRequest(AuthValidation.googleLoginSchema),
	AuthController.googleLogin,
);

export const AuthRoutes = router;
