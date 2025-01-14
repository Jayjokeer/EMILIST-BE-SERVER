import { Router, Request, Response } from "express";
import { adminAuth } from "../middlewares/current-user";
import * as adminController from "../controllers/admin.controller";
import { validateAddUserAdmin } from "../validations/admin.validation";
import { multipleUpload } from "../utils/image-upload";
import { validateJob } from "../validations/job.validation";

const router = Router();

router.route("/dashboard").get(adminAuth, adminController.adminDashboardController);
router.route("/users").get(adminAuth, adminController.fetchAllUsersAdminController);
router.route("/verify-user/:userId").patch(adminAuth, adminController.verifyUserAdminController);
router.route("/fetch-userDetails/:userId").get(adminAuth, adminController.fetchUserDetails);
router.route("/suspend-user/:userId").patch(adminAuth, adminController.suspendUserAdminController);
router.route("/add-user").post(adminAuth,validateAddUserAdmin, adminController.addUserAdminController);
router.route("/fetch-jobs").get(adminAuth, adminController.fetchJobsAdminController);
router.route("/fetch-job/:jobId").get(adminAuth, adminController.fetchSingleJobAdminController);
router.route("/create-job").post(adminAuth,multipleUpload,validateJob,adminController.createJobAdminController);
router.route("/fetch-all-materials").get(adminAuth,adminController.fetchAllMaterialsAdminController);
router.route("/fetch-material/:materialId").get(adminAuth,adminController.fetchSingleMaterialController);
router.route("/fetch-all-transactions").get(adminAuth,adminController.fetchAllTransactionsAdminController);
router.route("/fetch-transaction/:transactionId").get(adminAuth,adminController.fetchSingleTransactionAdminController);
router.route("/fetch-all-subscriptions").get(adminAuth,adminController.fetchSubscriptionsController);

export { router as AdminRoute };