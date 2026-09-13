import { Router } from "express";

const router = Router();

const moduleRoutes: { path: string; route: any }[] = [
	// Routes will be registered here (e.g. /auth, /users, /assessments)
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
