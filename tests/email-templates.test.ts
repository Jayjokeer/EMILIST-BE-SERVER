import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptDirectJobApplicationMessage,
  acceptJobApplicationMessage,
  adminCreatedCustomerMessage,
  adminCustomerMessage,
  adminInvitationMessage,
  counterOfferMessage,
  contractClosedReviewOwnerMessage,
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
import { config } from "../src/utils/config";

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
    contractClosedReviewOwnerMessage(missing, missing, missing, missing),
    acceptJobApplicationMessage(missing, missing, missing, missing),
    acceptDirectJobApplicationMessage(missing, missing, missing),
    sendInviteMessage(missing),
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

test("generated user and admin email links use their dedicated frontend URLs", () => {
  const originalUserUrl = config.frontendUrl;
  const originalAdminUrl = config.adminFrontendUrl;
  config.frontendUrl = "https://users.example.com/";
  config.adminFrontendUrl = "https://admin.example.com/login";

  try {
    const userEmails = [
      directJobApplicationMessage("User", "Owner", "job-id"),
      requestForQuoteMessage("User", "Owner", "job-id"),
      postQuoteMessage("Owner", "Artisan", "job-id"),
      sendMessage("User", "Sender"),
      sendJobApplicationMessage("Owner", "Artisan", "Job"),
      counterOfferMessage("User", "Sender", "Job", 1000, "NGN"),
      acceptJobApplicationMessage("Artisan", "Owner", "Job", "accepted"),
      acceptDirectJobApplicationMessage("Owner", "Artisan", "job-id"),
      contractClosedReviewOwnerMessage("Artisan", "Owner", "Job", "https://users.example.com/"),
    ];

    for (const email of userEmails) {
      assert.match(email.html, /href="https:\/\/users\.example\.com\/"/);
      assert.doesNotMatch(email.html, /admin\.example\.com/);
    }

    assert.match(
      sendInviteMessage("Inviter").html,
      /href="https:\/\/users\.example\.com\/sign-up"/,
    );
    assert.match(
      welcomeMessageAdmin("Admin").html,
      /href="https:\/\/admin\.example\.com\/login"/,
    );
  } finally {
    config.frontendUrl = originalUserUrl;
    config.adminFrontendUrl = originalAdminUrl;
  }
});
