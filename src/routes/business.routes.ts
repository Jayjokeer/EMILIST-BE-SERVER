import { Router, Request, Response } from "express";
import * as businesController from "../controllers/business.controller";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload, uploadBusinessImages } from "../utils/image-upload";
import { validateBusinessRegistration, validateBusinessUpdate } from "../validations/business.validation";

const router = Router();

router.route("/register-business").post(userAuth,uploadBusinessImages,validateBusinessRegistration,businesController.createBusinessController);
router.route("/update-business/:businessId").patch(userAuth,uploadBusinessImages,validateBusinessUpdate,businesController.updateBusinessController);
router.route("/fetch-single-business/:businessId").get(userAuth,businesController.fetchSingleBusinessController);
router.route("/fetch-user-business").get(userAuth,businesController.fetchUserBusinessController);
router.route("/delete-business/:businessId/image/:imageId").delete(userAuth,businesController.deleteBusinessImageController);
router.route("/fetch-all-business").get(userAuth,businesController.fetchAllBusinessController);
router.route("/delete-business/:business").delete(userAuth,businesController.deleteBusinessController);


export { router as BusinessRoute };

