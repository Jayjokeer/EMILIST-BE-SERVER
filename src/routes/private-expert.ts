import { Router, Request, Response } from "express";
import * as expertController from "../controllers/private-expert.controller";
import { validateExpert } from "../validations/private-expert.validation";
const router = Router();

router.route("/create-private-expert").post(validateExpert,expertController.createExpertController);


export { router as ExpertRoute };