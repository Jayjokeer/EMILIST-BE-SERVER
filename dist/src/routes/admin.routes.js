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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoute = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const adminController = __importStar(require("../controllers/admin.controller"));
const admin_validation_1 = require("../validations/admin.validation");
const image_upload_1 = require("../utils/image-upload");
const job_validation_1 = require("../validations/job.validation");
const router = (0, express_1.Router)();
exports.AdminRoute = router;
router.route("/dashboard").get(current_user_1.adminAuth, adminController.adminDashboardController);
router.route("/users").get(current_user_1.adminAuth, adminController.fetchAllUsersAdminController);
router.route("/verify-user/:userId").patch(current_user_1.adminAuth, adminController.verifyUserAdminController);
router.route("/fetch-userDetails/:userId").get(current_user_1.adminAuth, adminController.fetchUserDetails);
router.route("/suspend-user/:userId").patch(current_user_1.adminAuth, adminController.suspendUserAdminController);
router.route("/add-user").post(current_user_1.adminAuth, admin_validation_1.validateAddUserAdmin, adminController.addUserAdminController);
router.route("/fetch-jobs").get(current_user_1.adminAuth, adminController.fetchJobsAdminController);
router.route("/fetch-job/:jobId").get(current_user_1.adminAuth, adminController.fetchSingleJobAdminController);
router.route("/create-job").post(current_user_1.adminAuth, image_upload_1.multipleUpload, job_validation_1.validateJob, adminController.createJobAdminController);
router.route("/fetch-all-materials").get(current_user_1.adminAuth, adminController.fetchAllMaterialsAdminController);
router.route("/fetch-material/:materialId").get(current_user_1.adminAuth, adminController.fetchSingleMaterialController);
