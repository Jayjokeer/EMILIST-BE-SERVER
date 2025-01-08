import { Router, Request, Response } from "express";
import { adminAuth } from "../middlewares/current-user";
import * as adminController from "../controllers/admin.controller";
import { validateAddUserAdmin } from "../validations/admin.validation";

const router = Router();

router.route("/dashboard").get(adminAuth, adminController.adminDashboardController);
router.route("/users").get(adminAuth, adminController.fetchAllUsersAdminController);
router.route("/verify-user/:userId").patch(adminAuth, adminController.verifyUserAdminController);
router.route("/fetch-userDetails/:userId").get(adminAuth, adminController.fetchUserDetails);
router.route("/suspend-user/:userId").patch(adminAuth, adminController.suspendUserAdminController);
router.route("/add-user").post(adminAuth,validateAddUserAdmin, adminController.addUserAdminController);
export { router as AdminRoute };