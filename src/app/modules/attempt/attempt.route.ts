import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import validateRequest from "../../middleware/validateRequest";
import { AttemptController } from "./attempt.controller";
import { AttemptValidation } from "./attempt.validation";

const router = Router();

// candidate gets all their personal assessment attempts
router.get("/my", checkAuth("CANDIDATE"), AttemptController.getMyAttempts);
router.get(
	"/my-attempts",
	checkAuth("CANDIDATE"),
	AttemptController.getMyAttempts,
);

// candidate starts assessment attempt and activates timer
router.post(
	"/:id/start",
	checkAuth("CANDIDATE"),
	AttemptController.startAttempt,
);

// candidate gets examination questions during active attempt
router.get(
	"/:id/questions",
	checkAuth("CANDIDATE"),
	AttemptController.getAttemptQuestions,
);

// candidate submits answer or code for a specific question
router.post(
	"/:id/submit-answer",
	checkAuth("CANDIDATE"),
	validateRequest(AttemptValidation.submitAnswerZodSchema),
	AttemptController.submitAnswer,
);

// candidate records an anti-cheat event (e.g. tab switch / window blur)
router.post(
	"/:id/anti-cheat",
	checkAuth("CANDIDATE"),
	AttemptController.recordAntiCheatFlag,
);

// candidate finishes assessment and calculates final score
router.post(
	"/:id/finish",
	checkAuth("CANDIDATE"),
	AttemptController.finishAttempt,
);

// view assessment attempt result (candidate self, assessment recruiter, or admin)
router.get(
	"/:id/result",
	checkAuth("CANDIDATE", "RECRUITER", "ADMIN"),
	AttemptController.getAttemptResult,
);

export const AttemptRoutes = router;
