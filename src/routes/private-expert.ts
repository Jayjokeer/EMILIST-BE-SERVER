import { Router, Request, Response } from "express";
import * as expertController from "../controllers/private-expert.controller";
import { validateExpert } from "../validations/private-expert.validation";
import { singleUpload } from "../utils/image-upload";
import { adminAuth } from "../middlewares/current-user";
const router = Router();

router.route("/create-private-expert").post(singleUpload,validateExpert,expertController.createExpertController);
router.route("/fetch-private-expert/:id").get(adminAuth,expertController.fetchPrivateExpertByIdController);

export { router as ExpertRoute };