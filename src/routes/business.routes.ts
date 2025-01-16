import { Router, Request, Response } from "express";
import * as businesController from "../controllers/business.controller";
import { userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload, uploadBusinessImages } from "../utils/image-upload";
import { validateBusinessRegistration, validateBusinessUpdate } from "../validations/business.validation";

const router = Router();

router.route("/register-business").post(userAuth,uploadBusinessImages,validateBusinessRegistration,businesController.createBusinessController);
router.route("/update-business/:businessId").patch(userAuth,uploadBusinessImages,validateBusinessUpdate,businesController.updateBusinessController);
router.route("/fetch-single-business/:businessId").get(businesController.fetchSingleBusinessController);
router.route("/fetch-user-business").get(userAuth,businesController.fetchUserBusinessController);
router.route("/delete-business/:businessId/image/:imageId").delete(userAuth,businesController.deleteBusinessImageController);
router.route("/fetch-all-business").get(businesController.fetchAllBusinessController);
router.route("/delete-business/:businessId").delete(userAuth,businesController.deleteBusinessController);
router.route("/compare-business/:businessId").patch(userAuth,businesController.compareBusinessController);
router.route("/fetch-compared-business").get(userAuth,businesController.fetchAllComparedBusinessesController );
router.route("/like-business/:businessId").patch(userAuth, businesController.likeBusinessController);
router.route("/unlike-business/:businessId").patch(userAuth, businesController.unlikeBusinessController);
router.route("/fetch-other-business-by-user/:userId").get(businesController.fetchOtherBusinessByUserController  );
router.route("/fetch-similar-business-by-user/:businessId").get(businesController.fetchSimilarBusinessByUserController );
router.route("/fetch-business-reviews/:businessId").get(businesController.fetchBusinessReviewsController );

export { router as BusinessRoute };

