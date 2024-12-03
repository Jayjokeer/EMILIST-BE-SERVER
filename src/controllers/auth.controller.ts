import { NextFunction, Request, Response } from "express";
import { successResponse } from "../helpers/success-response";
import * as authService from '../services/auth.service';
import { ICreateUser, ISignUser } from "../interfaces/user.interface";
import { StatusCodes } from "http-status-codes";
import {  hashPassword ,  comparePassword  } from "../utils/hashing";
import { NotFoundError, BadRequestError, UnauthorizedError } from '../errors/error';
import { generateOTPData, generateShortUUID } from "../utils/utility";
import { generateJWTwithExpiryDate } from "../utils/jwt";
import { catchAsync } from "../errors/error-handler";
import { otpMessage, passwordResetMessage } from "../utils/templates";
import { sendEmail } from "../utils/send_email";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../utils/config";
import { UserStatus } from "../enums/user.enums";
import axios from "axios";
import * as notificationService from "../services/notification.service";
import { NotificationTypeEnum } from "../enums/notification.enum";
import * as walletService from "../services/wallet.services";

export const registerUserController = catchAsync( async (req: Request, res: Response) => {
    const {
      userName,
      email,
      password,
    } = req.body;
    const isEmailExists = await authService.findUserByEmail(email);

    if(isEmailExists) throw new BadRequestError("User with email already exists!");

    const isUserNameExists = await authService.findUserByUserName(userName);
    if(isUserNameExists) throw new BadRequestError("UserName already exists!");
    const encryptPwd = await hashPassword(password);

    const user: ICreateUser= {
      userName,
      email: email.toLowerCase(),
      password: encryptPwd,
      uniqueId:generateShortUUID()
    }
    const data = await authService.createUser(user);
    const userId = String(data._id);
    const {otp, otpCreatedAt, otpExpiryTime} = await generateOTPData(userId);
    data.otpExpiresAt = otpExpiryTime;
    data.registrationOtp = otp;
    await data.save();
    const walletPayload ={
      userId: data._id,
    }
   const wallet = await walletService.createWallet(walletPayload);
   data.wallet = wallet._id;
   await data.save();
    const {html, subject} = otpMessage(userName, otp);
    sendEmail(email, subject,html); 
   return successResponse(res,StatusCodes.CREATED, data);
});

export const loginController = catchAsync(async (req: Request, res: Response) => {
  const {
    email,
    password
  } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if(!foundUser) throw new NotFoundError("Invalid credentials!");
  if(!foundUser.password) throw new NotFoundError("Invalid credentials!");
  const pwdCompare = await comparePassword(password, foundUser.password);
  if(!pwdCompare) throw new NotFoundError("Invalid credentials!");

  if(foundUser.status == UserStatus.deactivated){
    throw new UnauthorizedError("Account Deactivated!!")
  }
  if(foundUser.isEmailVerified == false){
    throw new BadRequestError("Kindly verify your email!");
  }
  const token = await generateJWTwithExpiryDate({
    email: foundUser.email,
    id: foundUser._id,
    userName: foundUser.userName
  });
  const userData = await authService.findUserById(String(foundUser._id));
const user = {
  token,
  userData
};

  const checkWalletExists = await walletService.findUserWallet(String(foundUser._id));
if(!checkWalletExists){
  const wallet = await walletService.createWallet({userId: foundUser._id});
  foundUser.wallet = wallet._id;
  await foundUser.save();
}

  return successResponse(res, StatusCodes.OK, user)
});

export const verifyEmailController = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");

  const tokenData = await authService.findTokenService(otp);
  if(!tokenData) throw new BadRequestError("Otp expired!");

  if(foundUser.registrationOtp !== tokenData.registrationOtp) throw new BadRequestError("Otp expired!");
  foundUser.isEmailVerified = true;
  foundUser.registrationOtp = undefined;
  foundUser.otpExpiresAt = undefined;
  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Email verified successfully!");
});

export const forgetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");

  const { otp, otpExpiryTime } = await generateOTPData(String(foundUser._id));
  foundUser.otpExpiresAt = otpExpiryTime;
  foundUser.passwordResetOtp = otp;
  await foundUser.save();

  const { html, subject } = passwordResetMessage(foundUser.userName, otp);
  await sendEmail(email, subject, html); 

  return successResponse(res, StatusCodes.OK, "Password reset OTP sent to your email.");
});

export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");

  if (foundUser.passwordResetOtp !== otp) throw new BadRequestError("Invalid OTP");
  if (foundUser.otpExpiresAt && Date.now() > foundUser.otpExpiresAt.getTime()) {
    throw new BadRequestError("OTP expired, request a new one.");
  }

  const hashedPassword = await hashPassword(newPassword);
  foundUser.password = hashedPassword;
  foundUser.passwordResetOtp = undefined;
  foundUser.otpExpiresAt = undefined;
  await foundUser.save();
  const notificationPayload = {
    userId: foundUser._id,
    title: " Password Reset",
    message: "You just reset your password",
    type: NotificationTypeEnum.info
  }
  await notificationService.createNotification(notificationPayload);
  return successResponse(res, StatusCodes.OK, "Password reset successfully!");
});

export const updateUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user.id;
  
  const {
    fullName,
    gender,
    language,
    number1,
    number2,
    whatsAppNo,
    location,
    bio,
  } = req.body;

  const foundUser = await authService.findUserById(userId);
  if (!foundUser) throw new NotFoundError("User not found!");


  foundUser.fullName = fullName || foundUser.fullName;
  foundUser.gender = gender || foundUser.gender;
  foundUser.language = language || foundUser.language;
  foundUser.number1 = number1 || foundUser.number1;
  foundUser.number2 = number2 || foundUser.number2;
  foundUser.whatsAppNo = whatsAppNo || foundUser.whatsAppNo;
  foundUser.location = location || foundUser.location;
  foundUser.bio = bio || foundUser.bio;
  if (req.file) {
     foundUser.profileImage = req.file.path;
  }

  await foundUser.save();

  return successResponse(res, StatusCodes.OK, foundUser);
});

export const changePasswordController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId  = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const foundUser = await authService.findUserByIdWithPassword(userId);
  if (!foundUser) throw new NotFoundError("User not found!");

  const isPasswordValid = await comparePassword(currentPassword, foundUser.password);
  if (!isPasswordValid) throw new UnauthorizedError("Current password is incorrect!");

  const hashedNewPassword = await hashPassword(newPassword);
  foundUser.password = hashedNewPassword;

  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Password changed successfully!");
});

export const currentUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId  = req.user.id;

  const user = await authService.findUserById(userId);
  if (!user) throw new NotFoundError("User not found!");


  return successResponse(res, StatusCodes.OK, user);
});
export const uploadImage = catchAsync( async(req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = req.file.path;

  return successResponse(res, StatusCodes.OK, imageUrl);
});

export const uploadMultipleFiles = catchAsync( async(req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const fileUrls = files.map(file => file.path);


  return successResponse(res, StatusCodes.OK, fileUrls);
});

export const resendVerificationOtpController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Email is required");
  }

    const user = await authService.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email not verified!")
    }
    const userId = String(user._id);
    const {otp, otpCreatedAt, otpExpiryTime} = await generateOTPData(userId);
    user.otpExpiresAt = otpExpiryTime;
    user.registrationOtp = otp;
    await user.save();
    const {html, subject} =await otpMessage(user.userName, otp);
    await sendEmail(email, subject,html); 
    return successResponse(res, StatusCodes.OK, "Otp sent successfully");
});

export const googleRedirectController = catchAsync(async (req: Request, res: Response) => {
  const loggedIn = req.user as ISignUser;
  
  const token =  generateJWTwithExpiryDate({
    email: loggedIn.email,
    id: loggedIn.id,
    userName: loggedIn.userName,
  });
  const userData = await authService.findUserById(loggedIn.id);

  const queryParams = new URLSearchParams({
    token,
    id: userData!.id,
    email: userData!.email,
    userName: userData!.userName,
  }).toString();

  res.redirect(`${config.frontendUrl}?${queryParams}`);
});

export const logoutController = catchAsync(async (req: JwtPayload, res: Response) => {
  const user = await authService.findUserById(req.user.id);
console.log(user)
console.log(req.user.accessToken)
  if (user && user.accessToken) {
    await axios.get(`https://accounts.google.com/o/oauth2/revoke?token=${user.accessToken}`);

    user.accessToken = undefined;
    await user.save();
  }  return successResponse(res, StatusCodes.OK,  "Successfully logged out.");
});

export const deactivateUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const loggedIn = req.user as ISignUser;
  
  const deactivateUser = await authService.updateUserById(loggedIn.id,{status: UserStatus.deactivated});
  return successResponse(res, StatusCodes.OK,  "Successfully deactivated!");
});
export const findUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { user } = req.query;

  if (!user) {
    throw new BadRequestError("Query is required to search for a user");
  }
 
  const data = await authService.findSpecificUser(user);
  if (!data) {
    throw new NotFoundError("User not found!")
  }
  return successResponse(res, StatusCodes.OK, data);
});