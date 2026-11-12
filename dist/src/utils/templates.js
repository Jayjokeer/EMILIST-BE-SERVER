"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReminderEmail = exports.sendPrivateExpertMessage = exports.sendInviteMessage = exports.acceptDirectJobApplicationMessage = exports.acceptJobApplicationMessage = exports.counterOfferMessage = exports.sendJobApplicationMessage = exports.sendMessage = exports.postQuoteMessage = exports.requestForQuoteMessage = exports.directJobApplicationMessage = exports.adminCustomerMessage = exports.adminCreatedCustomerMessage = exports.customerPasswordResetMessage = exports.passwordResetMessage = exports.adminInvitationMessage = exports.welcomeMessageAdmin = exports.otpMessage = void 0;
const config_1 = require("./config");
const rawText = (value) => {
    if (value === undefined || value === null)
        return "";
    const text = String(value).trim();
    return /^(undefined|null|nan)$/i.test(text) ? "" : text;
};
const escapeHtml = (value) => rawText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const emailText = (value, fallback) => escapeHtml(rawText(value) || fallback);
const subjectText = (value, fallback) => (rawText(value) || fallback).replace(/[\r\n]+/g, " ");
const emailUrl = (value) => emailText(value, "#");
const otpMessage = (otp) => ({
    subject: "OTP Email",
    html: `<p>Your OTP is <strong>${emailText(otp, "unavailable")}</strong>, valid for 5 minutes.</p>`,
});
exports.otpMessage = otpMessage;
const welcomeMessageAdmin = (name) => ({
    subject: "Welcome to Emilist",
    html: `
    <p><strong>Hi ${emailText(name, "there")}, welcome to Emilist.</strong></p>
    <p>Go to <a href="${emailUrl(config_1.config.frontendLoginUrl)}">the Emilist platform</a> and use Forgot Password to create your password and log in.</p>`,
});
exports.welcomeMessageAdmin = welcomeMessageAdmin;
const adminInvitationMessage = (name, invitationUrl) => ({
    subject: "Your Emilist Admin invitation",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>You have been invited to Emilist Admin. This invitation expires in 48 hours.</p>
    <p><a href="${emailUrl(invitationUrl)}">Accept invite</a></p>`,
});
exports.adminInvitationMessage = adminInvitationMessage;
const passwordResetMessage = (name, resetUrl) => ({
    subject: "Reset your Emilist Admin password",
    html: `
    <p>Hi ${emailText(name, "Admin")},</p>
    <p>Use the secure link below to reset your Emilist Admin password. You will also need your authenticator app.</p>
    <p><a href="${emailUrl(resetUrl)}">Reset password</a></p>
    <p>This one-time link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`,
});
exports.passwordResetMessage = passwordResetMessage;
const customerPasswordResetMessage = (name, resetUrl) => ({
    subject: "Reset your Emilist password",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>An Emilist administrator sent you a secure password reset link.</p>
    <p><a href="${emailUrl(resetUrl)}">Reset password</a></p>
    <p>This one-time link expires in 30 minutes. If you did not expect it, contact Emilist support.</p>`,
});
exports.customerPasswordResetMessage = customerPasswordResetMessage;
const adminCreatedCustomerMessage = (name, resetUrl) => ({
    subject: "Your Emilist account has been created",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>An Emilist administrator created your customer profile.</p>
    <p><a href="${emailUrl(resetUrl)}">Create your password</a></p>
    <p>This secure link expires in 30 minutes.</p>`,
});
exports.adminCreatedCustomerMessage = adminCreatedCustomerMessage;
const adminCustomerMessage = (name, subject, message) => ({
    subject: subjectText(subject, "An update from Emilist"),
    html: `<p>Hi ${emailText(name, "there")},</p><p>${emailText(message, "You have a new account update.").replace(/\n/g, "<br/>")}</p><p>&mdash; Emilist Admin</p>`,
});
exports.adminCustomerMessage = adminCustomerMessage;
const directJobApplicationMessage = (name, creatorName, id) => ({
    subject: "Job Assigned to you",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(creatorName, "An Emilist customer")} created and assigned a job to you with ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to view and accept the job.</p>`,
});
exports.directJobApplicationMessage = directJobApplicationMessage;
const requestForQuoteMessage = (name, creatorName, id) => ({
    subject: "Request For Quote!",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(creatorName, "The job owner")} requested a quote for job ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to submit the quote.</p>`,
});
exports.requestForQuoteMessage = requestForQuoteMessage;
const postQuoteMessage = (name, posterName, id) => ({
    subject: "Quote Posted!",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(posterName, "The assigned professional")} posted a quote for job ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to accept or reject the quote.</p>`,
});
exports.postQuoteMessage = postQuoteMessage;
const sendMessage = (name, posterName) => ({
    subject: "New message",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(posterName, "An Emilist user")} sent you a message.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to respond.</p>`,
});
exports.sendMessage = sendMessage;
const sendJobApplicationMessage = (name, user, title) => ({
    subject: "New Job Application",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(user, "An Emilist professional")} applied to your job titled <strong>${emailText(title, "your job")}</strong>.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to review the application.</p>`,
});
exports.sendJobApplicationMessage = sendJobApplicationMessage;
const counterOfferMessage = (recipientName, senderName, jobTitle, amount, currency) => {
    const safeJobTitle = subjectText(jobTitle, "your job");
    const numericAmount = Number(amount);
    const formattedAmount = Number.isFinite(numericAmount)
        ? `${rawText(currency) ? `${rawText(currency)} ` : ""}${numericAmount.toLocaleString()}`
        : "an updated amount";
    return {
        subject: `New counteroffer for ${safeJobTitle}`,
        html: `
      <p>Hi ${emailText(recipientName, "there")},</p>
      <p>${emailText(senderName, "An Emilist user")} sent you a counteroffer of ${emailText(formattedAmount, "an updated amount")} for <strong>${emailText(jobTitle, "your job")}</strong>.</p>
      <p><a href="${emailUrl(config_1.config.frontendLoginUrl)}">Log in</a> to review, accept, reject, or counter the offer.</p>`,
    };
};
exports.counterOfferMessage = counterOfferMessage;
const acceptJobApplicationMessage = (name, user, title, status) => ({
    subject: "Application Updated",
    html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(user, "The job owner")} ${emailText(status, "updated")} your application for <strong>${emailText(title, "the job")}</strong>.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to view the update.</p>`,
});
exports.acceptJobApplicationMessage = acceptJobApplicationMessage;
const acceptDirectJobApplicationMessage = (creatorName, name, id) => ({
    subject: "Direct Job Accepted",
    html: `
    <p>Hi ${emailText(creatorName, "there")},</p>
    <p>${emailText(name, "The assigned professional")} accepted your direct job with ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(config_1.config.frontendLoginUrl)}">log in to your account</a> to view it.</p>`,
});
exports.acceptDirectJobApplicationMessage = acceptDirectJobApplicationMessage;
const sendInviteMessage = (creatorName, link) => ({
    subject: "Emilist Invite",
    html: `
    <p>You were invited by ${emailText(creatorName, "an Emilist user")} to join Emilist.</p>
    <p><a href="${emailUrl(link)}">Create your account</a></p>`,
});
exports.sendInviteMessage = sendInviteMessage;
const sendPrivateExpertMessage = (fullName, phoneNumber, email, typeOfExpert, details, location, time, date) => ({
    subject: "Private Expert Alert",
    html: `
    <p>${emailText(fullName, "A customer")} requested a private expert.</p>
    <p><strong>Full Name:</strong> ${emailText(fullName, "Not provided")}</p>
    <p><strong>Mobile:</strong> ${emailText(phoneNumber, "Not provided")}</p>
    <p><strong>Email:</strong> ${emailText(email, "Not provided")}</p>
    <p><strong>Expert Needed:</strong> ${emailText(typeOfExpert, "Not provided")}</p>
    <p><strong>Details:</strong> ${emailText(details, "Not provided")}</p>
    <p><strong>Location:</strong> ${emailText(location, "Not provided")}</p>
    <p><strong>Time:</strong> ${emailText(time, "Not provided")}</p>
    <p><strong>Date:</strong> ${emailText(date, "Not provided")}</p>`,
});
exports.sendPrivateExpertMessage = sendPrivateExpertMessage;
const generateReminderEmail = (userName, date) => {
    const safeDate = subjectText(date, "the scheduled date");
    return {
        subject: `Reminder: Your recurring job is scheduled for ${safeDate}`,
        html: `<p>Hello ${emailText(userName, "there")},</p><p>Your recurring job is scheduled for ${emailText(date, "the scheduled date")}. Please review and ensure everything is ready.</p>`,
    };
};
exports.generateReminderEmail = generateReminderEmail;
