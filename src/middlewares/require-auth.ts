import { NextFunction, Request, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../errors";

export const requireAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.currentUser) throw new UnauthorizedError();
  if (!req.currentUser.isEnabled)
    throw new BadRequestError("Your account is disabled");
  if (!req.currentUser.isEmailVerified)
    throw new BadRequestError("Please verify your account");
  next();
};
