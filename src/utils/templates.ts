import { config } from "./config";

export const otpMessage = (otp: string) => {
  const subject = "Otp Email";
  const html = `
        Your otp is ${otp}, valid for 5 minutes!`;

  return { html, subject };
};
export const welcomeMessageAdmin = (name: string) => {
  const subject = "Welcome to Emilist";
  const html = `
        <strong>${name} welcome to Emilist,</strong> <br/>kindly go to the platform here ${config.frontendLoginUrl} and click on forgot password to reset your password and log in!`;

  return { html, subject };
};

export const adminInvitationMessage = (name: string, invitationUrl: string) => {
  const subject = "Your Emilist Admin invitation";
  const html = `
        <p>Hi ${name},</p>
        <p>You have been invited to Emilist Admin. This invitation expires in 48 hours.</p>
        <p><a href="${invitationUrl}">Accept invite</a></p>`;

  return { html, subject };
};


export const passwordResetMessage= (name: string, resetUrl: string) => {
  const subject = "Reset your Emilist Admin password";
  const html = `
        <p>Hi ${name},</p>
        <p>Use the secure link below to reset your Emilist Admin password. You will also need your authenticator app.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This one-time link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`;

  return { html, subject };
};

export const customerPasswordResetMessage = (name: string, resetUrl: string) => {
  const subject = "Reset your Emilist password";
  const html = `
        <p>Hi ${name},</p>
        <p>An Emilist administrator sent you a secure password reset link.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This one-time link expires in 30 minutes. If you did not expect it, contact Emilist support.</p>`;
  return { html, subject };
};

export const adminCreatedCustomerMessage = (name: string, resetUrl: string) => {
  const subject = "Your Emilist account has been created";
  const html = `
        <p>Hi ${name},</p>
        <p>An Emilist administrator created your customer profile.</p>
        <p><a href="${resetUrl}">Create your password</a></p>
        <p>This secure link expires in 30 minutes.</p>`;
  return { html, subject };
};

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export const adminCustomerMessage = (name: string, subject: string, message: string) => ({
  subject,
  html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p><p>— Emilist Admin</p>`,
});

export const directJobApplicationMessage = (name: string, creatorName: string, id: string) => {
  const subject = "Job Assigned to you";
  const html = `
        Hi ${name}!, ${creatorName} created and assigned a job to you with ID: ${id}. kindly log into to your account to view and accept the job.`;

  return { html, subject };
};
export const requestForQuoteMessage = (name: string, creatorName: string, id: string) => {
  const subject = "Request For Quote!";
  const html = `
        Hi ${name}!, ${creatorName} requested for quote on job with ID: ${id}. kindly log into to your account to submit quote`;

  return { html, subject };
};

export const postQuoteMessage = (name: string, posterName: string, id: string) => {
  const subject = "Quote Posted!";
  const html = `
        Hi ${name}!, ${posterName} posted quote for job with ID: ${id}. kindly log into to your account to accept or reject quote`;

  return { html, subject };
};

export const sendMessage = (name: string, posterName: string,) => {
  const subject = "New message";
  const html = `
        Hi ${name}!, ${posterName} messaged you. kindly log into to your account to respond`;

  return { html, subject };
};

export const sendJobApplicationMessage = (name: string, user: string,title: string,) => {
  const subject = "New Job Application";
  const html = `
        Hi ${name}!, ${user} applied to your job titled: ${title}. kindly log into to your account to view ${config.frontendLoginUrl}`;

  return { html, subject };
};

export const counterOfferMessage = (
  recipientName: string,
  senderName: string,
  jobTitle: string,
  amount: number,
  currency?: string,
) => {
  const subject = `New counteroffer for ${jobTitle}`;
  const formattedAmount = `${currency ? `${currency} ` : ''}${Number(amount).toLocaleString()}`;
  const html = `
        Hi ${recipientName}!, ${senderName} sent you a counteroffer of ${formattedAmount} for the job titled: ${jobTitle}. Kindly log in to review, accept, reject, or counter the offer: ${config.frontendLoginUrl}`;

  return { html, subject };
};
export const acceptJobApplicationMessage = (name: string, user: string,title: string, status: string) => {
  const subject = "Application Accepted!";
  const html = `
        Hi ${name}!, ${user} ${status} your job application titled: ${title}. kindly log into to your account to view`;

  return { html, subject };
};

export const acceptDirectJobApplicationMessage = (creatorName: string, name: string,  id: string) => {
  const subject = "Direct Job Accepted";
  const html = `
        Hi ${creatorName}!, ${name} accepted your direct job with ID: ${id}. kindly log into to your account to view.`;

  return { html, subject };
};

export const sendInviteMessage = (creatorName: string, link: string) => {
  const subject = "Emilist Invite";
  const html = `
        You were invited by ${creatorName}, to join the emilist platform. Kindly click on this link to sign up ${link}`
  return { html, subject };
};


export const sendPrivateExpertMessage = (fullName: string, phoneNumber: string,email: string, typeOfExpert: string, details: string, location: string, time: string, date: any ) => {
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

return {html, subject}
};

export const generateReminderEmail = (userName: string, date: string) =>{
  return {
    subject: `Reminder: Your recurring job is scheduled for ${date}`,
    html: `<p>Hello ${userName},</p><p>Your recurring job is scheduled for ${date}. Please review and ensure everything is ready.</p>`,
  };
}
