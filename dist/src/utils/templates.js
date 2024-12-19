"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPrivateExpertMessage = exports.sendInviteMessage = exports.acceptDirectJobApplicationMessage = exports.acceptJobApplicationMessage = exports.sendJobApplicationMessage = exports.sendMessage = exports.postQuoteMessage = exports.requestForQuoteMessage = exports.directJobApplicationMessage = exports.passwordResetMessage = exports.otpMessage = void 0;
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
        Hi ${name}!, ${user} applied to your job titled: ${title}. kindly log into to your account to view`;
    return { html, subject };
};
exports.sendJobApplicationMessage = sendJobApplicationMessage;
const acceptJobApplicationMessage = (name, user, title, status) => {
    const subject = "Application Accepted!";
    const html = `
        Hi ${name}!, ${user} ${status} your job application titled: ${title}. kindly log into to your account to view`;
    return { html, subject };
};
exports.acceptJobApplicationMessage = acceptJobApplicationMessage;
const acceptDirectJobApplicationMessage = (creatorName, name, id) => {
    const subject = "Direct Job Accepted";
    const html = `
        Hi ${creatorName}!, ${name} accepted your direct job with ID: ${id}. kindly log into to your account to view.`;
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
