import { Router } from "express";
import { AssessmentRoutes } from "../modules/assessment/assessment.route";
import { AttemptRoutes } from "../modules/attempt/attempt.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { InvitationRoutes } from "../modules/invitation/invitation.route";
import { QuestionRoutes } from "../modules/question/question.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

// console.log("initializing application module routes");

const moduleRoutes: { path: string; route: any }[] = [
	{
		path: "/auth",
		route: AuthRoutes,
	},
	{
		path: "/users",
		route: UserRoutes,
	},
	{
		path: "/questions",
		route: QuestionRoutes,
	},
	{
		path: "/assessments",
		route: AssessmentRoutes,
	},
	{
		path: "/invitations",
		route: InvitationRoutes,
	},
	{
		path: "/attempts",
		route: AttemptRoutes,
	},
];

moduleRoutes.forEach((route) => {
	// console.log(`mounting route path: /api${route.path}`);
	router.use(route.path, route.route);
});

export default router;
