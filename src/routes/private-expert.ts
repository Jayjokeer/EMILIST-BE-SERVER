import { Router, Request, Response } from "express";
import * as expertController from "../controllers/private-expert.controller";
import { validateExpert } from "../validations/private-expert.validation";
import { singleUpload } from "../utils/image-upload";
const router = Router();

router.route("/create-private-expert").post(singleUpload,validateExpert,expertController.createExpertController);


export { router as ExpertRoute };