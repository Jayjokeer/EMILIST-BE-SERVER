import { Router } from "express";
import { userAuth } from "../middlewares/current-user";
import { createInvoiceDisputeController, createSupportRequestController, customerReplyToSupportRequestController, fetchMySupportRequestController, fetchMySupportRequestsController } from "../controllers/support.controller";
import { validateCreateInvoiceDispute, validateCreateSupportRequest, validateSupportReply } from "../validations/admin.validation";
import { applySupportImageAttachments, supportImageUpload } from "../utils/image-upload";

const router = Router();

router.post("/requests", userAuth, supportImageUpload, applySupportImageAttachments, validateCreateSupportRequest, createSupportRequestController);
router.get("/requests", userAuth, fetchMySupportRequestsController);
router.get("/requests/:requestId", userAuth, fetchMySupportRequestController);
router.post("/requests/:requestId/replies", userAuth, supportImageUpload, applySupportImageAttachments, validateSupportReply, customerReplyToSupportRequestController);
router.post("/job-invoice-disputes", userAuth, supportImageUpload, applySupportImageAttachments, validateCreateInvoiceDispute, createInvoiceDisputeController);

export { router as SupportRoute };
