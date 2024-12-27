import { Router, Request, Response } from "express";
import * as subscrbtionController from "../controllers/subcribtion.controller";
import { userAuth } from "../middlewares/current-user";
import { validateSubscriptionPayment } from "../validations/subscription.validation";

const router = Router();

router.route("/get-user-subscription").get(userAuth,subscrbtionController.getUserSubscription); 
router.route("/subscribe-plan").post(userAuth, validateSubscriptionPayment, subscrbtionController.subscribeToPlan);

export { router as SubscribeRoute };