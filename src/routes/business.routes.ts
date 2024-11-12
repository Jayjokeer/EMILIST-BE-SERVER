import { Router, Request, Response } from "express";
import * as businesController from "../controllers/business.controller";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload, uploadBusinessImages } from "../utils/image-upload";
import { validateBusinessRegistration } from "../validations/business.validation";

const router = Router();

router.route("/register-business").post(userAuth,uploadBusinessImages,validateBusinessRegistration,businesController.createBusinessController);


export { router as BusinessRoute };

