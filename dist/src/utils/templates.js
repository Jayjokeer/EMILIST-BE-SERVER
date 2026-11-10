"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReminderEmail = exports.sendPrivateExpertMessage = exports.sendInviteMessage = exports.acceptDirectJobApplicationMessage = exports.acceptJobApplicationMessage = exports.counterOfferMessage = exports.sendJobApplicationMessage = exports.sendMessage = exports.postQuoteMessage = exports.requestForQuoteMessage = exports.directJobApplicationMessage = exports.adminCustomerMessage = exports.adminCreatedCustomerMessage = exports.customerPasswordResetMessage = exports.passwordResetMessage = exports.adminInvitationMessage = exports.welcomeMessageAdmin = exports.otpMessage = void 0;
const config_1 = require("./config");
const otpMessage = (otp) => {
    const subject = "Otp Email";
    const html = `
        Your otp is ${otp}, valid for 5 minutes!`;
    return { html, subject };
};
exports.otpMessage = otpMessage;
const welcomeMessageAdmin = (name) => {
    const subject = "Welcome to Emilist";
    const html = `
        <strong>${name} welcome to Emilist,</strong> <br/>kindly go to the platform here ${config_1.config.frontendLoginUrl} and click on forgot password to reset your password and log in!`;
    return { html, subject };
};
exports.welcomeMessageAdmin = welcomeMessageAdmin;
const adminInvitationMessage = (name, invitationUrl) => {
    const subject = "Your Emilist Admin invitation";
    const html = `
        <p>Hi ${name},</p>
        <p>You have been invited to Emilist Admin. This invitation expires in 48 hours.</p>
        <p><a href="${invitationUrl}">Accept invite</a></p>`;
    return { html, subject };
};
exports.adminInvitationMessage = adminInvitationMessage;
const passwordResetMessage = (name, resetUrl) => {
    const subject = "Reset your Emilist Admin password";
    const html = `
        <p>Hi ${name},</p>
        <p>Use the secure link below to reset your Emilist Admin password. You will also need your authenticator app.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This one-time link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`;
    return { html, subject };
};
exports.passwordResetMessage = passwordResetMessage;
const customerPasswordResetMessage = (name, resetUrl) => {
    const subject = "Reset your Emilist password";
    const html = `
        <p>Hi ${name},</p>
        <p>An Emilist administrator sent you a secure password reset link.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This one-time link expires in 30 minutes. If you did not expect it, contact Emilist support.</p>`;
    return { html, subject };
};
exports.customerPasswordResetMessage = customerPasswordResetMessage;
const adminCreatedCustomerMessage = (name, resetUrl) => {
    const subject = "Your Emilist account has been created";
    const html = `
        <p>Hi ${name},</p>
        <p>An Emilist administrator created your customer profile.</p>
        <p><a href="${resetUrl}">Create your password</a></p>
        <p>This secure link expires in 30 minutes.</p>`;
    return { html, subject };
};
exports.adminCreatedCustomerMessage = adminCreatedCustomerMessage;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const emailText = (value, fallback) => {
    const text = typeof value === "string" ? value.trim() : "";
    return escapeHtml(text && text !== "undefined" && text !== "null" ? text : fallback);
};
const adminCustomerMessage = (name, subject, message) => ({
    subject,
    html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p><p>— Emilist Admin</p>`,
});
exports.adminCustomerMessage = adminCustomerMessage;
const directJobApplicationMessage = (name, creatorName, id) => {
    const subject = "Job Assigned to you";
    const html = `
        <p>Hi ${emailText(name, "there")},</p>
        <p>${emailText(creatorName, "An Emilist customer")} created and assigned a job to you with ID: ${emailText(id, "unavailable")}.</p>
        <p>Kindly <a href="${emailText(config_1.config.frontendLoginUrl, "#")}">log in to your account</a> to view and accept the job.</p>`;
    return { html, subject };
};
exports.directJobApplicationMessage = directJobApplicationMessage;
const requestForQuoteMessage = (name, creatorName, id) => {
    const subject = "Request For Quote!";
    const html = `
        Hi ${name}!, ${creatorName} requested for quote on job with ID: ${id}. kindly log into to your account to submit quote`;
    return { html, subject };
};
exports.requestForQuoteMessage = requestForQuoteMessage;
const postQuoteMessage = (name, posterName, id) => {
    const subject = "Quote Posted!";
    const html = `
        Hi ${name}!, ${posterName} posted quote for job with ID: ${id}. kindly log into to your account to accept or reject quote`;
    return { html, subject };
};
exports.postQuoteMessage = postQuoteMessage;
const sendMessage = (name, posterName) => {
    const subject = "New message";
    const html = `
        Hi ${name}!, ${posterName} messaged you. kindly log into to your account to respond`;
    return { html, subject };
};
exports.sendMessage = sendMessage;
const sendJobApplicationMessage = (name, user, title) => {
    const subject = "New Job Application";
    const html = `
        <p>Hi ${emailText(name, "there")},</p>
        <p>${emailText(user, "An Emilist professional")} applied to your job titled <strong>${emailText(title, "your job")}</strong>.</p>
        <p>Kindly <a href="${emailText(config_1.config.frontendLoginUrl, "#")}">log in to your account</a> to review the application.</p>`;
    return { html, subject };
};
exports.sendJobApplicationMessage = sendJobApplicationMessage;
const counterOfferMessage = (recipientName, senderName, jobTitle, amount, currency) => {
    const subject = `New counteroffer for ${jobTitle}`;
    const formattedAmount = `${currency ? `${currency} ` : ''}${Number(amount).toLocaleString()}`;
    const html = `
        Hi ${recipientName}!, ${senderName} sent you a counteroffer of ${formattedAmount} for the job titled: ${jobTitle}. Kindly log in to review, accept, reject, or counter the offer: ${config_1.config.frontendLoginUrl}`;
    return { html, subject };
};
exports.counterOfferMessage = counterOfferMessage;
const acceptJobApplicationMessage = (name, user, title, status) => {
    const subject = "Application Accepted!";
    const html = `
        <p>Hi ${emailText(name, "there")},</p>
        <p>${emailText(user, "The job owner")} ${emailText(status, "updated")} your application for <strong>${emailText(title, "the job")}</strong>.</p>
        <p>Kindly <a href="${emailText(config_1.config.frontendLoginUrl, "#")}">log in to your account</a> to view the update.</p>`;
    return { html, subject };
};
exports.acceptJobApplicationMessage = acceptJobApplicationMessage;
const acceptDirectJobApplicationMessage = (creatorName, name, id) => {
    const subject = "Direct Job Accepted";
    const html = `
        <p>Hi ${emailText(creatorName, "there")},</p>
        <p>${emailText(name, "The assigned professional")} accepted your direct job with ID: ${emailText(id, "unavailable")}.</p>
        <p>Kindly <a href="${emailText(config_1.config.frontendLoginUrl, "#")}">log in to your account</a> to view it.</p>`;
    return { html, subject };
};
exports.acceptDirectJobApplicationMessage = acceptDirectJobApplicationMessage;
const sendInviteMessage = (creatorName, link) => {
    const subject = "Emilist Invite";
    const html = `
        You were invited by ${creatorName}, to join the emilist platform. Kindly click on this link to sign up ${link}`;
    return { html, subject };
};
exports.sendInviteMessage = sendInviteMessage;
const sendPrivateExpertMessage = (fullName, phoneNumber, email, typeOfExpert, details, location, time, date) => {
    const subject = "Private Expert Alert";
    const html = `${fullName} requested for a private expert.\n\n
Details: \n\n
Full Name: ${fullName}\n\n
Mobile: ${phoneNumber}\n\n
Email: ${email}\n\n
Expert Needed: ${typeOfExpert}\n\n
Details: ${details}\n\n
Location: ${location}\n\n
Time: ${time}\n\n
Date: ${date}.\n\n`;
    return { html, subject };
};
exports.sendPrivateExpertMessage = sendPrivateExpertMessage;
const generateReminderEmail = (userName, date) => {
    return {
        subject: `Reminder: Your recurring job is scheduled for ${date}`,
        html: `<p>Hello ${userName},</p><p>Your recurring job is scheduled for ${date}. Please review and ensure everything is ready.</p>`,
    };
};
exports.generateReminderEmail = generateReminderEmail;
