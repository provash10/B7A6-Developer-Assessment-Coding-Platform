import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { AssessmentController } from "./assessment.controller";
import { AssessmentValidation } from "./assessment.validation";

const router = Router();

router.post(
	"/",
	checkAuth("ADMIN", "RECRUITER"),
	validateRequest(AssessmentValidation.createAssessmentZodSchema),
	AssessmentController.createAssessment,
);

router.get(
	"/",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	AssessmentController.getAllAssessments,
);

router.get(
	"/:id",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	AssessmentController.getSingleAssessment,
);

export const AssessmentRoutes = router;
