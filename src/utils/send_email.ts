import { config } from "./config";

const nodemailer = require("nodemailer");

/**
 * @description - This function is used to send the emails
 * @param {string} to - email to which the email is to be sent
 * @param {string} subject - subject of the email
 * @param {string} html - html fo the email
 * @returns {promise} -- Returns the promise of send email
 */

export const sanitizeEmailContent = (value: unknown, fallback: string) => {
  const text = value === undefined || value === null ? "" : String(value);
  if (!text.trim()) return fallback;
  return text.replace(/\b(?:undefined|null|NaN)\b/gi, "Not provided");
};

export const sendEmail = (
  to: string,
  subject: string,
  html: string
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const from = config.senderEmail;
      if (!config.senderEmail || !config.senderEmailPassword) {
        throw new Error("Email credentials (SENDER_EMAIL / SENDER_EMAIL_PASSWORD) are not configured!");
      }
      const recipient = to?.trim();
      if (!recipient) throw new Error("Email recipient is required");

      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true,
        auth: {
          user: config.senderEmail,
          pass: config.senderEmailPassword,
        },
      });

      const mailOptions = {
        from,
        to: recipient,
        subject: sanitizeEmailContent(subject, "An update from Emilist"),
        html: sanitizeEmailContent(html, "<p>You have a new update on Emilist.</p>"),
      };
      const data = await transporter.sendMail(mailOptions);
      resolve(data);
    } catch (error) {
      console.error("sendEmail error:", error);
      reject(error);
    }
  });
};
