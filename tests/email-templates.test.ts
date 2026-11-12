import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptDirectJobApplicationMessage,
  acceptJobApplicationMessage,
  adminCreatedCustomerMessage,
  adminCustomerMessage,
  adminInvitationMessage,
  counterOfferMessage,
  directJobApplicationMessage,
  generateReminderEmail,
  otpMessage,
  passwordResetMessage,
  postQuoteMessage,
  requestForQuoteMessage,
  sendInviteMessage,
  sendJobApplicationMessage,
  sendMessage,
  sendPrivateExpertMessage,
  customerPasswordResetMessage,
  welcomeMessageAdmin,
} from "../src/utils/templates";
import { sanitizeEmailContent } from "../src/utils/send_email";

const missing = undefined as any;

test("all email templates replace missing values with readable fallbacks", () => {
  const emails = [
    otpMessage(missing),
    welcomeMessageAdmin(missing),
    adminInvitationMessage(missing, missing),
    passwordResetMessage(missing, missing),
    customerPasswordResetMessage(missing, missing),
    adminCreatedCustomerMessage(missing, missing),
    adminCustomerMessage(missing, missing, missing),
    directJobApplicationMessage(missing, missing, missing),
    requestForQuoteMessage(missing, missing, missing),
    postQuoteMessage(missing, missing, missing),
    sendMessage(missing, missing),
    sendJobApplicationMessage(missing, missing, missing),
    counterOfferMessage(missing, missing, missing, missing, missing),
    acceptJobApplicationMessage(missing, missing, missing, missing),
    acceptDirectJobApplicationMessage(missing, missing, missing),
    sendInviteMessage(missing, missing),
    sendPrivateExpertMessage(missing, missing, missing, missing, missing, missing, missing, missing),
    generateReminderEmail(missing, missing),
  ];

  for (const email of emails) {
    assert.ok(email.subject.trim());
    assert.ok(email.html.trim());
    assert.doesNotMatch(`${email.subject} ${email.html}`, /\b(?:undefined|null|NaN)\b/i);
  }
});

test("outbound email sanitizer removes unresolved interpolation values", () => {
  assert.equal(
    sanitizeEmailContent("Hello undefined, value null and NaN", "fallback"),
    "Hello Not provided, value Not provided and Not provided",
  );
  assert.equal(sanitizeEmailContent(undefined, "fallback"), "fallback");
});
