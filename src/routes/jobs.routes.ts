import { Router, Request, Response } from "express";
import * as jobController from "../controllers/jobs.controller";
import { validateJob } from "../validations/job.validation";
import { userAuth } from "../middlewares/current-user";

const router = Router();

router.route("/create-job").post(userAuth, validateJob,jobController.createJobController);

export { router as JobsRoute };
