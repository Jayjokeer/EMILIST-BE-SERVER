import { Router, Request, Response } from "express";
import * as targetController from "../controllers/target.controller";
import { validateTarget } from "../validations/target.validation";
import { userAuth } from "../middlewares/current-user";
const router = Router();

router.route("/create-target").post(userAuth,validateTarget,targetController.createTargetController);


export { router as TargetRoute };