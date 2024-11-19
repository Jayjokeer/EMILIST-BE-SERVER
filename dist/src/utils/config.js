"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv").config();
exports.config = {
    baseUrl: process.env.BASE_URL,
    env: process.env.NODE_ENV,
    jwtForgotPasswordSecret: process.env.JWT_FORGOT_PASSWORD_SECRET,
    jwtExpirationInterval: process.env.JWT_EXPIRATION_INTERVAL,
    jwtSecret: process.env.JWT_SECRET,
    mongo: process.env.MONGO_URI,
    senderEmail: process.env.SENDER_EMAIL,
    senderEmailPassword: process.env.SENDER_EMAIL_PASSWORD,
    port: process.env.PORT,
    otpSecret: process.env.OTP_SECRET,
    fbClientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    fbClientId: process.env.FACEBOOK_CLIENT_ID,
    frontendUrl: process.env.GOOGLE_REDIRECT_URI,
    sessionSecret: process.env.SESSION_SECRET,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    cloudinarySecretKey: process.env.CLOUDINARY_SECRET_KEY,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryName: process.env.CLOUDINARY_NAME,
};
