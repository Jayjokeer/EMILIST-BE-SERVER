import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { ISignUser } from "../interfaces/user.interface";
import { verifyJWT } from "../utils/jwt";

export const currentUserMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  let token

  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
  }

  if(!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ Message: 'Not Logged In' });
  }
  
  try {
    const payload = verifyJWT(
      token,
    ) as ISignUser;

    req.user = payload;
  } catch (error) {}
  next();
};
