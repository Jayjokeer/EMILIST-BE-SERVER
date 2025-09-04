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
exports.JobsRoute = void 0;
const express_1 = require("express");
const jobController = __importStar(require("../controllers/jobs.controller"));
const job_validation_1 = require("../validations/job.validation");
const current_user_1 = require("../middlewares/current-user");
const image_upload_1 = require("../utils/image-upload");
const paymentController = __importStar(require("../controllers/payment.controller"));
const product_validation_1 = require("../validations/product.validation");
const router = (0, express_1.Router)();
exports.JobsRoute = router;
router.route("/create-job").post(current_user_1.userAuth, image_upload_1.multipleUpload, job_validation_1.validateJob, jobController.createJobController);
router.route("/fetch-all-jobs").get(jobController.allJobsController);
router.route("/fetch-listed-jobs").get(current_user_1.userAuth, jobController.allUserJobController);
router.route("/fetch-job-by-id").get(jobController.fetchSingleJobController);
router.route("/like-job/:jobId").post(current_user_1.userAuth, jobController.likeJobController);
router.route("/fetch-liked-jobs").get(current_user_1.userAuth, jobController.fetchLikedJobsController);
router.route("/unlike-job/:jobId").post(current_user_1.userAuth, jobController.unlikeJobController);
router.route("/apply-job").post(current_user_1.userAuth, job_validation_1.validateProjectApplication, jobController.applyForJobController);
router.route("/withdraw-job-application/:projectId").delete(current_user_1.userAuth, jobController.deleteJobApplicationController);
router.route("/delete-job/:jobId").delete(current_user_1.userAuth, jobController.deleteJobController);
router.route("/update-job/:jobId").put(current_user_1.userAuth, image_upload_1.multipleUpload, job_validation_1.validateUpdateJob, jobController.updateJobController);
router.route("/update-application-status/:projectId").patch(current_user_1.userAuth, jobController.jobStatusController);
router.route("/fetch-jobs-by-status").get(current_user_1.userAuth, jobController.fetchJobByStatusController);
router.route("/remove-job/:jobId/file/:fileId").delete(current_user_1.userAuth, jobController.deleteFileController);
router.route("/accept-direct-job/:projectId").patch(current_user_1.userAuth, jobController.acceptDirectJobController);
router.route("/fetch-applied-jobs-by-status").get(current_user_1.userAuth, jobController.fetchUserAppliedJobsController);
router.route("/fetch-applications-by-status").get(current_user_1.userAuth, jobController.fetchApplicationByStatusController);
router.route("/update-milestone-status/:jobId/milestone/:milestoneId").patch(current_user_1.userAuth, job_validation_1.validateMilestoneStatusUpdate, jobController.updateMilestoneStatusController);
router.route("/request-for-quote/:jobId").patch(current_user_1.userAuth, jobController.requestForQuoteController);
router.route("/post-quote").patch(current_user_1.userAuth, job_validation_1.validatePostQuote, jobController.postQuoteController);
router.route("/update-quote-status/:projectId").patch(current_user_1.userAuth, jobController.acceptQuoteController);
router.route("/update-milestone-payment").patch(current_user_1.userAuth, image_upload_1.singleUpload, job_validation_1.validateUpdateMilestonePayment, jobController.updateMilestonePaymentController);
router.route("/user-job-analytics").get(current_user_1.userAuth, jobController.jobAnalyticsController);
router.route("/close-contract/:jobId").patch(current_user_1.userAuth, jobController.closeContractController);
router.route("/fetch-job-count-creator").get(current_user_1.userAuth, jobController.fetchJobCountsController);
router.route("/fetch-project-count").get(current_user_1.userAuth, jobController.fetchProjectCountsController);
router.route("/user-project-analytics").get(current_user_1.userAuth, jobController.projectAnalyticsController);
router.route("/mute-job/:jobId").get(current_user_1.userAuth, jobController.muteJobController);
router.route("/pay-for-job").post(current_user_1.userAuth, product_validation_1.validatePaymentForJob, paymentController.payforJobController);
router.route("/leads").get(current_user_1.userAuth, jobController.jobLeadsController);
router.route("/create-recurring-job").post(current_user_1.userAuth, image_upload_1.multipleUpload, job_validation_1.validateRecurringJob, jobController.createRecurringJobController);
router.route("/fetch-recurring-jobs").get(current_user_1.userAuth, jobController.fetchAllRecurringJobsController);
