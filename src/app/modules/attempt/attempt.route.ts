import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { AttemptController } from "./attempt.controller";
import { AttemptValidation } from "./attempt.validation";

const router = Router();

// Candidate starts assessment attempt and activates timer
router.post(
	"/:id/start",
	checkAuth("CANDIDATE"),
	AttemptController.startAttempt,
);

// Candidate gets examination questions during active attempt
router.get(
	"/:id/questions",
	checkAuth("CANDIDATE"),
	AttemptController.getAttemptQuestions,
);

// Candidate submits answer or code for a specific question
router.post(
	"/:id/submit-answer",
	checkAuth("CANDIDATE"),
	validateRequest(AttemptValidation.submitAnswerZodSchema),
	AttemptController.submitAnswer,
);

export const AttemptRoutes = router;
