import { Router, Request, Response } from "express";
import * as subscrbtionController from "../controllers/subcribtion.controller";
import { adminAuth, userAuth } from "../middlewares/current-user";
import { promoteJobAndBusinessValidation, validateSubscriptionPayment } from "../validations/subscription.validation";
import * as planController from "../controllers/plan.controller";

const router = Router();

router.route("/get-user-subscription").get(userAuth,subscrbtionController.getUserSubscription); 
router.route("/subscribe-plan").post(userAuth, validateSubscriptionPayment, subscrbtionController.subscribeToPlan);
router.route("/create-plan").post(adminAuth, planController.createPlanController);
router.route("/get-plans").get(planController.getPlansController);
router.route("/promote/:id").post(userAuth,promoteJobAndBusinessValidation, subscrbtionController.promoteJobAndBusinessController);
export { router as SubscribeRoute };