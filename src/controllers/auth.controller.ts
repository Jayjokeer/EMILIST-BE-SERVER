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
import { otpMessage } from "../utils/templates";
import { sendEmail } from "../utils/send_email";

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
      email,
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
  if(foundUser.verified == false){
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
  foundUser.verified = true;
  foundUser.registrationOtp = undefined;
  foundUser.otpExpiresAt = undefined;
  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Email verified successfully!");
});
