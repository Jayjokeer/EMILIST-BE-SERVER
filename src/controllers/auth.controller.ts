import { NextFunction, Request, Response } from "express";
import { successResponse } from "../helpers/success-response";
import * as authService from '../services/auth.service';
import { ICreateUser, ISignUser } from "../interfaces/user.interface";
import { StatusCodes } from "http-status-codes";
import {  hashPassword ,  comparePassword  } from "../utils/hashing";
import { NotFoundError, BadRequestError, UnauthorizedError } from '../errors/error';
import { generateShortUUID } from "../utils/utility";
import { generateJWTwithExpiryDate } from "../utils/jwt";
import { catchAsync } from "../errors/error-handler";

export const registerUserController = catchAsync( async (req: Request, res: Response) => {
    const {
      userName,
      email,
      password,
    } = req.body;

    const encryptPwd = await hashPassword(password);

    const user: ICreateUser= {
      userName,
      email,
      password: encryptPwd,
      uniqueId:generateShortUUID()
    }
    const data = await authService.createUser(user);

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

  const data = await generateJWTwithExpiryDate({
    email: foundUser.email,
    id: foundUser._id,
    userName: foundUser.userName
  })
  return successResponse(res, StatusCodes.OK, data)
})