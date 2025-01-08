require("dotenv").config();


export const config = {
  baseUrl: process.env.BASE_URL as string,
  env: process.env.NODE_ENV,
  jwtForgotPasswordSecret: process.env.JWT_FORGOT_PASSWORD_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_INTERVAL,
  jwtSecret: process.env.JWT_SECRET,
  mongo:process.env.MONGO_URI,
  senderEmail: process.env.SENDER_EMAIL,
  senderEmailPassword: process.env.SENDER_EMAIL_PASSWORD,
  port: process.env.PORT,
  otpSecret: process.env.OTP_SECRET as string,
  fbClientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
  fbClientId: process.env.FACEBOOK_CLIENT_ID as string,
  frontendUrl: process.env.GOOGLE_REDIRECT_URI as string,
  sessionSecret: process.env.SESSION_SECRET as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  cloudinarySecretKey: process.env.CLOUDINARY_SECRET_KEY as string,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY as string,
  cloudinaryName: process.env.CLOUDINARY_NAME as string,
  frontendSignUpUrl: process.env.FRONTEND_SIGNUP as string,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY as string,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY as string,
  adminEmail: process.env.ADMIN_EMAIL as string,
  frontendLoginUrl: process.env.FRONTEND_LOGIN as string,
};
