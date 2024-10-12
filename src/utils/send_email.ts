import { config } from "./config";

const nodemailer = require("nodemailer");
config
/**
 * @description - This function is used to send the emails
 * @param {string} to - email to which the email is to be sent
 * @param {string} from - email from which the email is to be sent
 * @param {string} subject - subject of the email
 * @param {string} html - html fo the email
 * @returns {promise} -- Returns the promise of send email
 */

export const sendEmail = ( to: string,  subject: string, html: string ) =>{
  new Promise(async (resolve, reject) => {
    try {
      const  from = config.senderEmail;
      const transporter = nodemailer.createTransport({
        service: "gmail", 
        auth: {
          user: config.senderEmail, 
          pass: config.senderEmailPassword,
        },
      })

      const mailOptions = {
        from, 
        to, 
        subject, 
        html
      };
      const data = await transporter.sendMail(mailOptions);
      resolve(data);
    } catch (error) {
      console.error("error", error);
      reject(error);
    }
  });
}