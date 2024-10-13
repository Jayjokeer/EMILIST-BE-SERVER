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

export const registerUserController = catchAsync( async (req: Request, res: Response) => {
    const {
      userName,
      email,
      password,
    } = req.body;
    const isEmailExists = await authService.findUserByEmail(email);

    if(isEmailExists) throw new BadRequestError("User with email already exists!");

    const isUserNameExists = await authService.findUserByUserName(userName);
    console.log(isUserNameExists)
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
    const {html, subject} = otpMessage(userName, otp);
    sendEmail(email, subject,html); 
    successResponse(res,StatusCodes.CREATED, data);
})

export const login = catchAsync(async (req: Request, res: Response) => {
  const {
    email,
    password
  } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if(!foundUser) throw new NotFoundError("Invalid credentials!");

  const pwdCompare = await comparePassword(password, foundUser.password);
  if(!pwdCompare) throw new NotFoundError("Invalid credentials!");
  if(foundUser.isEmailVerified == false){
    throw new BadRequestError("Kindly verify your email!");
  }
  const data = await generateJWTwithExpiryDate({
    email: foundUser.email,
    id: foundUser._id,
    userName: foundUser.userName
  })
  return successResponse(res, StatusCodes.OK, data)
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

  await foundUser.save();

  return successResponse(res, StatusCodes.OK, foundUser);
});

export const changePasswordController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId  = req.user;
  const { currentPassword, newPassword } = req.body;

  const foundUser = await authService.findUserById(userId);
  if (!foundUser) throw new NotFoundError("User not found!");

  const isPasswordValid = await comparePassword(currentPassword, foundUser.password);
  if (!isPasswordValid) throw new UnauthorizedError("Current password is incorrect!");

  const hashedNewPassword = await hashPassword(newPassword);
  foundUser.password = hashedNewPassword;

  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Password changed successfully!");
});

export const currentUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId  = req.user;

  const user = await authService.findUserById(userId);
  if (!user) throw new NotFoundError("User not found!");


  return successResponse(res, StatusCodes.OK, user);
});