"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
// Paystack delivers webhooks here. The route parses the body as a raw Buffer
// (express.raw) because the HMAC-SHA512 signature must be verified over the
// exact raw request body - this router is mounted in server.ts BEFORE
// express.json for that reason. No auth middleware: the signature is the auth.
const router = (0, express_1.Router)();
exports.webhookRouter = router;
router.route("/paystack").post(webhook_controller_1.paystackWebhookController);
