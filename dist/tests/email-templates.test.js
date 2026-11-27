"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const templates_1 = require("../src/utils/templates");
const send_email_1 = require("../src/utils/send_email");
const config_1 = require("../src/utils/config");
const missing = undefined;
(0, node_test_1.default)("all email templates replace missing values with readable fallbacks", () => {
    const emails = [
        (0, templates_1.otpMessage)(missing),
        (0, templates_1.welcomeMessageAdmin)(missing),
        (0, templates_1.adminInvitationMessage)(missing, missing),
        (0, templates_1.passwordResetMessage)(missing, missing),
        (0, templates_1.customerPasswordResetMessage)(missing, missing),
        (0, templates_1.adminCreatedCustomerMessage)(missing, missing),
        (0, templates_1.adminCustomerMessage)(missing, missing, missing),
        (0, templates_1.directJobApplicationMessage)(missing, missing, missing),
        (0, templates_1.requestForQuoteMessage)(missing, missing, missing),
        (0, templates_1.postQuoteMessage)(missing, missing, missing),
        (0, templates_1.sendMessage)(missing, missing),
        (0, templates_1.sendJobApplicationMessage)(missing, missing, missing),
        (0, templates_1.counterOfferMessage)(missing, missing, missing, missing, missing),
        (0, templates_1.contractClosedReviewOwnerMessage)(missing, missing, missing, missing),
        (0, templates_1.contractCloseReminderEmail)(missing, missing, missing),
        (0, templates_1.acceptJobApplicationMessage)(missing, missing, missing, missing),
        (0, templates_1.acceptDirectJobApplicationMessage)(missing, missing, missing),
        (0, templates_1.sendInviteMessage)(missing),
        (0, templates_1.sendPrivateExpertMessage)(missing, missing, missing, missing, missing, missing, missing, missing, missing),
        (0, templates_1.generateReminderEmail)(missing, missing),
    ];
    for (const email of emails) {
        strict_1.default.ok(email.subject.trim());
        strict_1.default.ok(email.html.trim());
        strict_1.default.doesNotMatch(`${email.subject} ${email.html}`, /\b(?:undefined|null|NaN)\b/i);
    }
});
(0, node_test_1.default)("outbound email sanitizer removes unresolved interpolation values", () => {
    strict_1.default.equal((0, send_email_1.sanitizeEmailContent)("Hello undefined, value null and NaN", "fallback"), "Hello Not provided, value Not provided and Not provided");
    strict_1.default.equal((0, send_email_1.sanitizeEmailContent)(undefined, "fallback"), "fallback");
});
(0, node_test_1.default)("admin invitation email renders the supplied branded message and invitation details", () => {
    const email = (0, templates_1.adminInvitationMessage)("Jane Doe", "https://admin.example.com/accept-invite?token=abc", "Super Admin", "Support Agent", "jane@example.com", new Date("2026-11-20T12:00:00.000Z"));
    strict_1.default.match(email.html, /administrator_updates\.jpg/);
    strict_1.default.match(email.html, /Hello Jane Doe/);
    strict_1.default.match(email.html, /Super Admin/);
    strict_1.default.match(email.html, /Support Agent/);
    strict_1.default.match(email.html, /jane@example\.com/);
    strict_1.default.match(email.html, /href="https:\/\/admin\.example\.com\/accept-invite\?token=abc"/);
    strict_1.default.match(email.html, /authenticator app/);
});
(0, node_test_1.default)("generated user and admin email links use their dedicated frontend URLs", () => {
    const originalUserUrl = config_1.config.frontendUrl;
    const originalAdminUrl = config_1.config.adminFrontendUrl;
    config_1.config.frontendUrl = "https://users.example.com/";
    config_1.config.adminFrontendUrl = "https://admin.example.com/login";
    try {
        const userEmails = [
            (0, templates_1.directJobApplicationMessage)("User", "Owner", "job-id"),
            (0, templates_1.requestForQuoteMessage)("User", "Owner", "job-id"),
            (0, templates_1.postQuoteMessage)("Owner", "Artisan", "job-id"),
            (0, templates_1.sendMessage)("User", "Sender"),
            (0, templates_1.sendJobApplicationMessage)("Owner", "Artisan", "Job"),
            (0, templates_1.counterOfferMessage)("User", "Sender", "Job", 1000, "NGN"),
            (0, templates_1.acceptJobApplicationMessage)("Artisan", "Owner", "Job", "accepted"),
            (0, templates_1.acceptDirectJobApplicationMessage)("Owner", "Artisan", "job-id"),
            (0, templates_1.contractClosedReviewOwnerMessage)("Artisan", "Owner", "Job", "https://users.example.com/"),
        ];
        for (const email of userEmails) {
            strict_1.default.match(email.html, /href="https:\/\/users\.example\.com\/"/);
            strict_1.default.doesNotMatch(email.html, /admin\.example\.com/);
        }
        strict_1.default.match((0, templates_1.sendInviteMessage)("Inviter").html, /href="https:\/\/users\.example\.com\/sign-up"/);
        strict_1.default.match((0, templates_1.contractCloseReminderEmail)("Owner", "Job", "https://users.example.com/?action=close-job-contract").html, /href="https:\/\/users\.example\.com\/\?action=close-job-contract"/);
        strict_1.default.match((0, templates_1.welcomeMessageAdmin)("Admin").html, /href="https:\/\/admin\.example\.com\/login"/);
    }
    finally {
        config_1.config.frontendUrl = originalUserUrl;
        config_1.config.adminFrontendUrl = originalAdminUrl;
    }
});
