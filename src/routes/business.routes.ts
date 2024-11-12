import { Router, Request, Response } from "express";
import * as businesController from "../controllers/business.controller";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload, uploadBusinessImages } from "../utils/image-upload";
import { validateBusinessRegistration, validateBusinessUpdate } from "../validations/business.validation";

const router = Router();

router.route("/register-business").post(userAuth,uploadBusinessImages,validateBusinessRegistration,businesController.createBusinessController);
router.route("/update-business/:businessId").patch(userAuth,uploadBusinessImages,validateBusinessUpdate,businesController.updateBusinessController);


export { router as BusinessRoute };

