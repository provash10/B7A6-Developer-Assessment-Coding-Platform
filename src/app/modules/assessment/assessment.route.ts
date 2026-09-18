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

router.patch(
	"/:id",
	checkAuth("ADMIN", "RECRUITER"),
	validateRequest(AssessmentValidation.updateAssessmentZodSchema),
	AssessmentController.updateAssessment,
);

router.post(
	"/:id/questions",
	checkAuth("ADMIN", "RECRUITER"),
	validateRequest(AssessmentValidation.addQuestionZodSchema),
	AssessmentController.addQuestionToAssessment,
);

router.delete(
	"/:id/questions/:questionId",
	checkAuth("ADMIN", "RECRUITER"),
	AssessmentController.removeQuestionFromAssessment,
);

router.delete(
	"/:id",
	checkAuth("ADMIN", "RECRUITER"),
	AssessmentController.deleteAssessment,
);

// get leaderboard ranking of candidates for assessment
router.get(
	"/:id/leaderboard",
	checkAuth("ADMIN", "RECRUITER"),
	AssessmentController.getAssessmentLeaderboard,
);

// get performance analytics and statistics for assessment
router.get(
	"/:id/analytics",
	checkAuth("ADMIN", "RECRUITER"),
	AssessmentController.getAssessmentAnalytics,
);

export const AssessmentRoutes = router;
