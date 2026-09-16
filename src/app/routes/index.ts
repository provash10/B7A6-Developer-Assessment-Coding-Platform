import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { QuestionRoutes } from "../modules/question/question.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
