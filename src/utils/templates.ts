
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

export const directJobApplicationMessage= (name: string, creatorName: string, id: string) => {
  const subject = "Job Assigned to you";
  const html = `
        Hi ${name}!, ${creatorName} created and assigned a job to you with ID: ${id}. kindly log into to your account to view and accept the job.`;

  return { html, subject };
};