"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sanitizeEmailContent = void 0;
const config_1 = require("./config");
const nodemailer = require("nodemailer");
/**
 * @description - This function is used to send the emails
 * @param {string} to - email to which the email is to be sent
 * @param {string} subject - subject of the email
 * @param {string} html - html fo the email
 * @returns {promise} -- Returns the promise of send email
 */
const sanitizeEmailContent = (value, fallback) => {
    const text = value === undefined || value === null ? "" : String(value);
    if (!text.trim())
        return fallback;
    return text.replace(/\b(?:undefined|null|NaN)\b/gi, "Not provided");
};
exports.sanitizeEmailContent = sanitizeEmailContent;
const sendEmail = (to, subject, html) => {
    return new Promise(async (resolve, reject) => {
        try {
            const from = config_1.config.senderEmail;
            if (!config_1.config.senderEmail || !config_1.config.senderEmailPassword) {
                throw new Error("Email credentials (SENDER_EMAIL / SENDER_EMAIL_PASSWORD) are not configured!");
            }
            const recipient = to?.trim();
            if (!recipient)
                throw new Error("Email recipient is required");
            const transporter = nodemailer.createTransport({
                host: "smtp.zoho.com",
                port: 465,
                secure: true,
                auth: {
                    user: config_1.config.senderEmail,
                    pass: config_1.config.senderEmailPassword,
                },
            });
            const mailOptions = {
                from,
                to: recipient,
                subject: (0, exports.sanitizeEmailContent)(subject, "An update from Emilist"),
                html: (0, exports.sanitizeEmailContent)(html, "<p>You have a new update on Emilist.</p>"),
            };
            const data = await transporter.sendMail(mailOptions);
            resolve(data);
        }
        catch (error) {
            console.error("sendEmail error:", error);
            reject(error);
        }
    });
};
exports.sendEmail = sendEmail;
