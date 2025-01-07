import { Router, Request, Response } from "express";
import { adminAuth } from "../middlewares/current-user";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.route("/dashboard").get(adminAuth, adminController.adminDashboardController);
router.route("/users").get(adminAuth, adminController.fetchAllUsersAdminController);
export { router as AdminRoute };