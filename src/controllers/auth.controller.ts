import { NextFunction, Request, Response } from "express";
import { successResponse } from "../helpers/success-response";
import * as authService from '../services/auth.service';
import { ICreateUser } from "../interfaces/user.interface";
import { StatusCodes } from "http-status-codes";

export const registerUserController = async (req: Request, res: Response) => {
    const {
      userName,
      email,
      password,
    } = req.body;

    const user: ICreateUser= {
      userName,
      email,
      password,
    }
    const data = await authService.createUser(user);

    return successResponse(res,StatusCodes.CREATED, data);
}