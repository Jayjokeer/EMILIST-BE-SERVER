"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const config_1 = require("./config");
const nodemailer = require("nodemailer");
config_1.config;
/**
 * @description - This function is used to send the emails
 * @param {string} to - email to which the email is to be sent
 * @param {string} from - email from which the email is to be sent
 * @param {string} subject - subject of the email
 * @param {string} html - html fo the email
 * @returns {promise} -- Returns the promise of send email
 */
const sendEmail = (to, subject, html) => {
    new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const from = config_1.config.senderEmail;
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
                to,
                subject,
                html
            };
            const data = yield transporter.sendMail(mailOptions);
            resolve(data);
        }
        catch (error) {
            console.error("error", error);
            reject(error);
        }
    }));
};
exports.sendEmail = sendEmail;
