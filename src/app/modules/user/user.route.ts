import { Router } from "express";
import { upload } from "../../lib/multer";
import checkAuth from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();

router.get("/me", checkAuth(), UserController.getMyProfile);
router.patch("/me", checkAuth(), UserController.updateMyProfile);

router.patch(
	"/profile-image",
	checkAuth(),
	upload.single("profileImage"),
	UserController.uploadProfileImage,
);

router.patch(
	"/resume",
	checkAuth("CANDIDATE"),
	upload.single("resume"),
	UserController.uploadResume,
);

router.patch(
	"/company-logo",
	checkAuth("RECRUITER"),
	upload.single("companyLogo"),
	UserController.uploadCompanyLogo,
);

router.get("/", checkAuth("ADMIN"), UserController.getAllUsers);
router.patch("/:id/role", checkAuth("ADMIN"), UserController.updateUserRole);

export const UserRoutes = router;
