import { Router } from "express";
import { userAuth } from "../middlewares/current-user";
import { createSupportRequestController, customerReplyToSupportRequestController } from "../controllers/support.controller";
import { validateCreateSupportRequest, validateSupportReply } from "../validations/admin.validation";

const router = Router();

router.post("/requests", userAuth, validateCreateSupportRequest, createSupportRequestController);
router.post("/requests/:requestId/replies", userAuth, validateSupportReply, customerReplyToSupportRequestController);

export { router as SupportRoute };
