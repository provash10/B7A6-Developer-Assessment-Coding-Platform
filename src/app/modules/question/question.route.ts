import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { QuestionController } from "./question.controller.js";
import { QuestionValidation } from "./question.validation.js";

const router = Router();

router.post(
	"/",
	checkAuth("ADMIN", "RECRUITER"),
	validateRequest(QuestionValidation.createQuestionZodSchema),
	QuestionController.createQuestion,
);

router.get(
	"/",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	QuestionController.getAllQuestions,
);

router.get(
	"/:id",
	checkAuth("ADMIN", "RECRUITER", "CANDIDATE"),
	QuestionController.getQuestionById,
);

router.patch(
	"/:id",
	checkAuth("ADMIN", "RECRUITER"),
	validateRequest(QuestionValidation.updateQuestionZodSchema),
	QuestionController.updateQuestion,
);

router.delete(
	"/:id",
	checkAuth("ADMIN", "RECRUITER"),
	QuestionController.deleteQuestion,
);

export const QuestionRoutes = router;
