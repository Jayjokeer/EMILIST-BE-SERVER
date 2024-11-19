"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postQuoteMessage = exports.requestForQuoteMessage = exports.directJobApplicationMessage = exports.passwordResetMessage = exports.otpMessage = void 0;
const otpMessage = (name, otp) => {
    const subject = "Otp Email";
    const html = `
        ${name} your otp is ${otp}, valid for 10 minutes!`;
    return { html, subject };
};
exports.otpMessage = otpMessage;
const passwordResetMessage = (name, otp) => {
    const subject = "Password reset otp";
    const html = `
        ${name} your password reset otp is ${otp}, valid for 10 minutes!`;
    return { html, subject };
};
exports.passwordResetMessage = passwordResetMessage;
const directJobApplicationMessage = (name, creatorName, id) => {
    const subject = "Job Assigned to you";
    const html = `
        Hi ${name}!, ${creatorName} created and assigned a job to you with ID: ${id}. kindly log into to your account to view and accept the job.`;
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
