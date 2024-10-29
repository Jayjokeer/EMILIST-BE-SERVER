import { Router, Request, Response } from "express";
import * as jobController from "../controllers/jobs.controller";
import { validateJob } from "../validations/job.validation";
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
router.route("/apply-job").post(userAuth, jobController.applyForJobController);
router.route("/withdraw-job-application/:projectId").delete(userAuth, jobController.deleteJobApplicationController);

export { router as JobsRoute };
