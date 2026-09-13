import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();

router.get("/me", checkAuth(), UserController.getMyProfile);
router.patch("/me", checkAuth(), UserController.updateMyProfile);

router.get("/", checkAuth("ADMIN"), UserController.getAllUsers);
router.patch("/:id/role", checkAuth("ADMIN"), UserController.updateUserRole);

export const UserRoutes = router;
