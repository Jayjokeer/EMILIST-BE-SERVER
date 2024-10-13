require("dotenv").config();


export const config = {
  baseUrl: process.env.BASE_URL || "",
  env: process.env.NODE_ENV,
  jwtForgotPasswordSecret: process.env.JWT_FORGOT_PASSWORD_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_INTERVAL,
  jwtSecret: process.env.JWT_SECRET,
  mongo:process.env.MONGO_URI,
  senderEmail: process.env.SENDER_EMAIL,
  senderEmailPassword: process.env.SENDER_EMAIL_PASSWORD,
  port: process.env.PORT,
  otpSecret: process.env.OTP_SECRET
};
