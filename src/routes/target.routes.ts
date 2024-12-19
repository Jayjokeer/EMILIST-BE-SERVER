import { Router, Request, Response } from "express";
import * as targetController from "../controllers/target.controller";
import { validateTarget } from "../validations/target.validation";
const router = Router();

router.route("/create-target").post(validateTarget,targetController.createTargetController);


export { router as TargetRoute };