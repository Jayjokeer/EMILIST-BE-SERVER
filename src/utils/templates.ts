
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