
export const otpMessage = (name: string, otp: string) => {
  const subject = "Otp Email";
  const html = `
        ${name} your otp is ${otp}, valid for 10 minutes!`;

  return { html, subject };
};


export const passwordResetMessage= (name: string, otp: string) => {
  const subject = "Password reset otp";
  const html = `
        ${name} your password reset otp is ${otp}, valid for 10 minutes!`;

  return { html, subject };
};

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
        Hi ${name}!, ${user} applied to your job titled: ${title}. kindly log into to your account to view`;

  return { html, subject };
};
export const acceptJobApplicationMessage = (name: string, user: string,title: string, status: string) => {
  const subject = "Application Accepted!";
  const html = `
        Hi ${name}!, ${user} ${status} your job application titled: ${title}. kindly log into to your account to view`;

  return { html, subject };
};