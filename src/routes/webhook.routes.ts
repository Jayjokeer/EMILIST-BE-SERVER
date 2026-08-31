import { Router } from "express";
import { paystackWebhookController } from "../controllers/webhook.controller";

// Paystack delivers webhooks here. The route parses the body as a raw Buffer
// (express.raw) because the HMAC-SHA512 signature must be verified over the
// exact raw request body - this router is mounted in server.ts BEFORE
// express.json for that reason. No auth middleware: the signature is the auth.
const router = Router();

router.route("/paystack").post(paystackWebhookController);

export { router as webhookRouter };