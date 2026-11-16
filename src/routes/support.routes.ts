import { Router } from "express";
import { userAuth } from "../middlewares/current-user";
import { createInvoiceDisputeController, createSupportRequestController, customerReplyToSupportRequestController, fetchMySupportRequestController, fetchMySupportRequestsController } from "../controllers/support.controller";
import { validateCreateInvoiceDispute, validateCreateSupportRequest, validateSupportReply } from "../validations/admin.validation";

const router = Router();

router.post("/requests", userAuth, validateCreateSupportRequest, createSupportRequestController);
router.get("/requests", userAuth, fetchMySupportRequestsController);
router.get("/requests/:requestId", userAuth, fetchMySupportRequestController);
router.post("/requests/:requestId/replies", userAuth, validateSupportReply, customerReplyToSupportRequestController);
router.post("/job-invoice-disputes", userAuth, validateCreateInvoiceDispute, createInvoiceDisputeController);

export { router as SupportRoute };
