"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoute = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const adminController = __importStar(require("../controllers/admin.controller"));
const admin_validation_1 = require("../validations/admin.validation");
const image_upload_1 = require("../utils/image-upload");
const job_validation_1 = require("../validations/job.validation");
const walletController = __importStar(require("../controllers/wallet.controller"));
const router = (0, express_1.Router)();
exports.AdminRoute = router;
router.route("/dashboard").get(current_user_1.adminAuth, adminController.adminDashboardController);
router.route("/users").get(current_user_1.adminAuth, adminController.fetchAllUsersAdminController);
router.route("/verify-user").patch(current_user_1.adminAuth, adminController.verifyUserAdminController);
router.route("/fetch-userDetails/:userId").get(current_user_1.adminAuth, adminController.fetchUserDetails);
router.route("/suspend-user/:userId").patch(current_user_1.adminAuth, adminController.suspendUserAdminController);
router.route("/add-user").post(current_user_1.adminAuth, admin_validation_1.validateAddUserAdmin, adminController.addUserAdminController);
router.route("/fetch-jobs").get(current_user_1.adminAuth, adminController.fetchJobsAdminController);
router.route("/fetch-job/:jobId").get(current_user_1.adminAuth, adminController.fetchSingleJobAdminController);
router.route("/create-job").post(current_user_1.adminAuth, image_upload_1.multipleUpload, job_validation_1.validateJob, adminController.createJobAdminController);
router.route("/fetch-all-materials").get(current_user_1.adminAuth, adminController.fetchAllMaterialsAdminController);
router.route("/fetch-material/:materialId").get(current_user_1.adminAuth, adminController.fetchSingleMaterialController);
router.route("/fetch-all-transactions").get(current_user_1.adminAuth, adminController.fetchAllTransactionsAdminController);
router.route("/fetch-transaction/:transactionId").get(current_user_1.adminAuth, adminController.fetchSingleTransactionAdminController);
router.route("/fetch-all-subscriptions").get(current_user_1.adminAuth, adminController.fetchSubscriptionsController);
router.route("/update-vat").patch(current_user_1.adminAuth, adminController.updateVatController);
router.route("/verify-bank-transfer").post(current_user_1.adminAuth, walletController.verifyBankTransferWalletFunding);
router.route("/fetch-private-experts").get(current_user_1.adminAuth, adminController.fetchAllPrivateExpertsController);
router.route("/fetch-private-expert/:id").get(current_user_1.adminAuth, adminController.fetchPrivateExpertByIdController);
router.route("/update-job-payment/:jobId").patch(current_user_1.adminAuth, admin_validation_1.validateJobPaymentAdmin, adminController.updateJobPaymentStatusController);
router.route("/add-category").post(current_user_1.adminAuth, adminController.addCategoriesController);
router.route("/fetch-category/:id").get(adminController.fetchSingleCategoryController);
router.route("/delete-category/:id").delete(current_user_1.adminAuth, adminController.deleteCategoryController);
router.route("/fetch-all-categories").get(adminController.fetchAllCategoriesController);
router.route("/fetch-user-account-details/:userId").get(current_user_1.adminAuth, adminController.fetchUserAccountDetailsController);
router.route("/fetch-user-subscriptions/:userId").get(current_user_1.adminAuth, adminController.fetchUserSubscriptionsController);
router.route("/fetch-all-verifications").get(current_user_1.adminAuth, adminController.fetchAllVerificationsController);
router.route("/create-admin").post(current_user_1.superAdminAuth, adminController.createAdminController);
router.route("/login").post(adminController.loginAdminController);
router.route("/change-status-admin").patch(current_user_1.superAdminAuth, adminController.changeStatusAdmin);
