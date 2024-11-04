import { Router, Request, Response } from "express";
import * as jobController from "../controllers/jobs.controller";
import { validateJob, validateProjectApplication, validateUpdateJob } from "../validations/job.validation";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload } from "../utils/image-upload";

const router = Router();

router.route("/create-job").post(userAuth,multipleUpload,validateJob,jobController.createJobController);
router.route("/fetch-all-jobs").get(jobController.allJobsController);
router.route("/fetch-listed-jobs").get(userAuth,jobController.allUserJobController);
router.route("/fetch-job-by-id").get(jobController.fetchSinlgeJobController);
router.route("/like-job/:jobId").post(userAuth,jobController.likeJobController);
router.route("/fetch-liked-jobs").get(userAuth, jobController.fetchLikedJobsController);
router.route("/unlike-job/:jobId").post(userAuth, jobController.unlikeJobController);
router.route("/apply-job").post(userAuth,validateProjectApplication, jobController.applyForJobController);
router.route("/withdraw-job-application/:projectId").delete(userAuth, jobController.deleteJobApplicationController);
router.route("/delete-job/:jobId").delete(userAuth, jobController.deleteJobController);
router.route("/update-job/:jobId").put(userAuth, multipleUpload, validateUpdateJob, jobController.updateJobController);
router.route("/update-application-status/:projectId").patch(userAuth, jobController.jobStatusController);
router.route("/fetch-jobs-by-status").get(userAuth, jobController.fetchJobByStatusController);
router.route("/remove-job/:jobId/file/:fileId").delete(userAuth, jobController.deleteFileController);
router.route("/accept-direct-job/:projectId").get(userAuth, jobController.acceptDirectJobController);
router.route("/fetch-applied-jobs-by-status").get(userAuth, jobController.fetchUserAppliedJobsController);

export { router as JobsRoute };

