import { UserRole } from "@prisma/client";
import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { AdminController } from "./admin.controller";

const router = Router();

// console.log("admin routes initialized");

// dashboard overall platform statistics endpoint
router.get(
	"/dashboard-stats",
	checkAuth(UserRole.ADMIN),
	AdminController.getDashboardStats,
);

// audit trail logs endpoint
router.get(
	"/audit-logs",
	checkAuth(UserRole.ADMIN),
	AdminController.getAuditLogs,
);

export const AdminRoutes = router;
