import { config } from "./config";
import { buildFrontendUrl } from "./frontend-url";

const rawText = (value: unknown) => {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  return /^(undefined|null|nan)$/i.test(text) ? "" : text;
};

const escapeHtml = (value: unknown) => rawText(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const emailText = (value: unknown, fallback: string) =>
  escapeHtml(rawText(value) || fallback);

const subjectText = (value: unknown, fallback: string) =>
  (rawText(value) || fallback).replace(/[\r\n]+/g, " ");

const emailUrl = (value: unknown) => emailText(value, "#");
const userFrontendUrl = () => buildFrontendUrl(config.frontendUrl);
const adminFrontendUrl = () => buildFrontendUrl(config.adminFrontendUrl);

export const otpMessage = (otp: string) => ({
  subject: "OTP Email",
  html: `<p>Your OTP is <strong>${emailText(otp, "unavailable")}</strong>, valid for 5 minutes.</p>`,
});

export const welcomeMessageAdmin = (name: string) => ({
  subject: "Welcome to Emilist",
  html: `
    <p><strong>Hi ${emailText(name, "there")}, welcome to Emilist.</strong></p>
    <p>Go to <a href="${emailUrl(adminFrontendUrl())}">the Emilist Admin platform</a> and use Forgot Password to create your password and log in.</p>`,
});

export const adminInvitationMessage = (
  name: string,
  invitationUrl: string,
  invitedBy = "Emilist Admin",
  role = "administrator",
  email = "",
  expiresAt?: Date,
) => ({
  subject: "Your Emilist Admin invitation",
  html: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Your Emilist Admin invitation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#17241d;-webkit-text-size-adjust:100%">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">
      Accept your invitation to set up your Emilist Admin account.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f5">
      <tr>
        <td align="center" style="padding:32px 12px">
          <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e5ebe7;border-radius:12px;border-spacing:0;table-layout:fixed">
            <tr>
              <td style="padding:0">
                <img src="https://res.cloudinary.com/dkdmwicti/image/upload/v1795002971/administrator_updates.jpg" alt="Emilist administrator updates" width="600" border="0" style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px 12px 0 0" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px">
                <h1 style="margin:0 0 24px;color:#17241d;font-size:26px;line-height:34px;font-weight:700">You&rsquo;re invited to Emilist Admin</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:26px">Hello ${emailText(name, "there")},</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:26px"><strong>${emailText(invitedBy, "Emilist Admin")}</strong> has invited you to join <strong>Emilist Admin</strong> as <strong>${emailText(role, "administrator")}</strong>.</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:26px">Accept your invitation to review your account details, create your password, and secure your access with an authenticator app.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0">
                  <tr>
                    <td align="center" bgcolor="#109f52" style="background-color:#109f52;border-radius:6px;mso-padding-alt:14px 28px">
                      <a href="${emailUrl(invitationUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;border:1px solid #109f52;border-radius:6px;color:#ffffff;font-size:16px;line-height:24px;font-weight:700;text-align:center;text-decoration:none;mso-padding-alt:0">Accept Invitation</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#58675e;font-size:14px;line-height:23px">Your invitation expires on <strong>${emailText(
                  expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime())
                    ? expiresAt.toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Lagos" })
                    : "48 hours",
                  "48 hours",
                )}</strong>. If it expires, ask your inviter to send a new invitation.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px">
                  <tr>
                    <td style="padding-top:24px;border-top:1px solid #e5ebe7">
                      <p style="margin:0 0 10px;color:#58675e;font-size:13px;line-height:21px">If the button doesn&rsquo;t open, copy and paste this link into your browser:</p>
                      <p style="margin:0;font-size:12px;line-height:20px;word-break:break-all;overflow-wrap:anywhere"><a href="${emailUrl(invitationUrl)}" style="color:#08753c;text-decoration:underline">${emailUrl(invitationUrl)}</a></p>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#58675e;font-size:13px;line-height:22px">For help with this invitation, contact ${emailText(invitedBy, "your administrator")} or your administrator. If you weren&rsquo;t expecting this invitation, you can ignore this email.</p>
                <p style="margin:24px 0 0;font-size:14px;line-height:23px">Best regards,<br /><strong>The Emilist Team</strong></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px;background-color:#f8faf9;border-top:1px solid #e5ebe7;border-radius:0 0 12px 12px">
                <p style="margin:0 0 16px;color:#58675e;font-size:13px;line-height:20px">Stay connected with Emilist</p>
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:0 8px"><img src="https://res.cloudinary.com/dkdmwicti/image/upload/v1795002968/facebook.jpg" alt="Facebook" width="28" height="28" border="0" style="display:block;border-radius:4px" /></td>
                    <td style="padding:0 8px"><img src="https://res.cloudinary.com/dkdmwicti/image/upload/v1795002970/linkedin.jpg" alt="LinkedIn" width="28" height="28" border="0" style="display:block;border-radius:4px" /></td>
                    <td style="padding:0 8px"><img src="https://res.cloudinary.com/dkdmwicti/image/upload/v1795002970/instagram.jpg" alt="Instagram" width="28" height="28" border="0" style="display:block;border-radius:4px" /></td>
                    <td style="padding:0 8px"><img src="https://res.cloudinary.com/dkdmwicti/image/upload/v1795002970/twitter.jpg" alt="Twitter" width="28" height="28" border="0" style="display:block;border-radius:4px" /></td>
                  </tr>
                </table>
                <p style="margin:20px 0 6px;color:#68766e;font-size:12px;line-height:20px">This email was sent to ${emailText(email, "the invited administrator")} about an Emilist Admin invitation.</p>
                <p style="margin:0;color:#68766e;font-size:12px;line-height:20px">&copy; ${new Date().getFullYear()} Emilist. All rights reserved.</p>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`,
});

export const passwordResetMessage = (name: string, resetUrl: string) => ({
  subject: "Reset your Emilist Admin password",
  html: `
    <p>Hi ${emailText(name, "Admin")},</p>
    <p>Use the secure link below to reset your Emilist Admin password. You will also need your authenticator app.</p>
    <p><a href="${emailUrl(resetUrl)}">Reset password</a></p>
    <p>This one-time link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`,
});

export const customerPasswordResetMessage = (name: string, resetUrl: string) => ({
  subject: "Reset your Emilist password",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>An Emilist administrator sent you a secure password reset link.</p>
    <p><a href="${emailUrl(resetUrl)}">Reset password</a></p>
    <p>This one-time link expires in 30 minutes. If you did not expect it, contact Emilist support.</p>`,
});

export const adminCreatedCustomerMessage = (name: string, resetUrl: string) => ({
  subject: "Your Emilist account has been created",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>An Emilist administrator created your customer profile.</p>
    <p><a href="${emailUrl(resetUrl)}">Create your password</a></p>
    <p>This secure link expires in 30 minutes.</p>`,
});

export const adminCustomerMessage = (name: string, subject: string, message: string) => ({
  subject: subjectText(subject, "An update from Emilist"),
  html: `<p>Hi ${emailText(name, "there")},</p><p>${emailText(message, "You have a new account update.").replace(/\n/g, "<br/>")}</p><p>&mdash; Emilist Admin</p>`,
});

export const directJobApplicationMessage = (name: string, creatorName: string, id: string) => ({
  subject: "Job Assigned to you",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(creatorName, "An Emilist customer")} created and assigned a job to you with ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to view and accept the job.</p>`,
});

export const requestForQuoteMessage = (name: string, creatorName: string, id: string) => ({
  subject: "Request For Quote!",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(creatorName, "The job owner")} requested a quote for job ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to submit the quote.</p>`,
});

export const postQuoteMessage = (name: string, posterName: string, id: string) => ({
  subject: "Quote Posted!",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(posterName, "The assigned professional")} posted a quote for job ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to accept or reject the quote.</p>`,
});

export const sendMessage = (name: string, posterName: string) => ({
  subject: "New message",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(posterName, "An Emilist user")} sent you a message.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to respond.</p>`,
});

export const sendJobApplicationMessage = (name: string, user: string, title: string) => ({
  subject: "New Job Application",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(user, "An Emilist professional")} applied to your job titled <strong>${emailText(title, "your job")}</strong>.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to review the application.</p>`,
});

export const counterOfferMessage = (
  recipientName: string,
  senderName: string,
  jobTitle: string,
  amount: number,
  currency?: string,
) => {
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
      <p><a href="${emailUrl(userFrontendUrl())}">Log in</a> to review, accept, reject, or counter the offer.</p>`,
  };
};

export const acceptJobApplicationMessage = (name: string, user: string, title: string, status: string) => ({
  subject: "Application Updated",
  html: `
    <p>Hi ${emailText(name, "there")},</p>
    <p>${emailText(user, "The job owner")} ${emailText(status, "updated")} your application for <strong>${emailText(title, "the job")}</strong>.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to view the update.</p>`,
});

export const acceptDirectJobApplicationMessage = (creatorName: string, name: string, id: string) => ({
  subject: "Direct Job Accepted",
  html: `
    <p>Hi ${emailText(creatorName, "there")},</p>
    <p>${emailText(name, "The assigned professional")} accepted your direct job with ID: ${emailText(id, "unavailable")}.</p>
    <p>Kindly <a href="${emailUrl(userFrontendUrl())}">log in to your account</a> to view it.</p>`,
});

export const contractClosedReviewOwnerMessage = (
  artisanName: string,
  jobOwnerName: string,
  jobTitle: string,
  reviewUrl: string,
) => ({
  subject: `Contract closed: Review ${subjectText(jobOwnerName, "the job owner")}`,
  html: `
    <p>Hi ${emailText(artisanName, "there")},</p>
    <p>The contract for <strong>${emailText(jobTitle, "your completed job")}</strong> has been closed by ${emailText(jobOwnerName, "the job owner")}.</p>
    <p>Please share your experience by writing a review for the job owner.</p>
    <p><a href="${emailUrl(reviewUrl)}">Review the job owner</a></p>`,
});

export const contractCloseReminderEmail = (
  jobOwnerName: string,
  jobTitle: string,
  closeContractUrl: string,
) => ({
  subject: `Action required: Close ${subjectText(jobTitle, "your completed job")}`,
  html: `
    <p>Hi ${emailText(jobOwnerName, "there")},</p>
    <p>All milestones for <strong>${emailText(jobTitle, "your job")}</strong> have been completed and paid.</p>
    <p>Please review the completed work and close the contract.</p>
    <p><a href="${emailUrl(closeContractUrl)}">Review and close contract</a></p>`,
});

export const sendInviteMessage = (creatorName: string) => ({
  subject: "Emilist Invite",
  html: `
    <p>You were invited by ${emailText(creatorName, "an Emilist user")} to join Emilist.</p>
    <p><a href="${emailUrl(buildFrontendUrl(config.frontendUrl, { path: "/sign-up" }))}">Create your account</a></p>`,
});

export const sendPrivateExpertMessage = (
  fullName: string,
  phoneNumber: string,
  email: string,
  typeOfExpert: string,
  details: string,
  location: string,
  time: string,
  date: unknown,
) => ({
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

export const generateReminderEmail = (userName: string, date: string) => {
  const safeDate = subjectText(date, "the scheduled date");
  return {
    subject: `Reminder: Your recurring job is scheduled for ${safeDate}`,
    html: `<p>Hello ${emailText(userName, "there")},</p><p>Your recurring job is scheduled for ${emailText(date, "the scheduled date")}. Please review and ensure everything is ready.</p>`,
  };
};

export const invoicePaymentReminderEmail = (
  userName: string,
  jobTitle: string,
  initial = false,
) => ({
  subject: initial
    ? `Invoice ready for ${subjectText(jobTitle, "your job")}`
    : `Payment reminder for ${subjectText(jobTitle, "your job")}`,
  html: `
    <p>Hello ${emailText(userName, "there")},</p>
    <p>${initial ? "An invoice has been raised" : "This is a reminder that an invoice is still awaiting payment"} for <strong>${emailText(jobTitle, "your job")}</strong>.</p>
    <p>Please open the job on Emilist to review the invoice and complete payment.</p>`,
});
