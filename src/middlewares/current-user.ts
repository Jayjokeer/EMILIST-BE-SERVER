import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyJWT } from "../utils/jwt";
import { UnauthorizedError } from "../errors/error";
import * as authService from '../services/auth.service';
import { JwtPayload } from "jsonwebtoken";
import { AdminRolesEnum, UserRolesEnum } from "../enums/user.enums";
import * as adminService from "../services/admin.service";


export const userAuth = async (req: JwtPayload, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }else if(req.cookies.sessionId ){
    token = req.cookies?.sessionId;
  }
console.log(req.cookies?.sessionId)
  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Kindly login" });
    return;
  }

  try {
    const decode = verifyJWT(token);

    if (!decode || !decode.email) {
      throw new UnauthorizedError("Authentication Failure");
    }

    const user = await authService.findUserByEmail(decode.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError("No user found");
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedError("Access Denied! Your account is disabled, please contact admin.");
    }
    req.user = user;
    
    next();
    
  } catch (error) {
    console.error("Auth Error:", error);

    res.status(StatusCodes.UNAUTHORIZED).json({
      message: error instanceof UnauthorizedError ? error.message : "Authentication Failure",
    });
    return;
  }
};
export const adminAuth = async (req: JwtPayload, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Kindly login" });
    return;
  }

  try {
    const decode = verifyJWT(token);

    if (!decode || !decode.email) {
      throw new UnauthorizedError("Authentication Failure");
    }

    const user = await adminService.getAdminByEmail(decode.email.toLowerCase());
    
    if (!user) {
      throw new UnauthorizedError("No user found");
    }
   if (user.role !== AdminRolesEnum.admin && user.role !== AdminRolesEnum.superAdmin) {
  throw new UnauthorizedError("Admin access only");
}

    req.user = user;
    
    next();
    
  } catch (error) {
    console.error("Auth Error:", error);

    res.status(StatusCodes.UNAUTHORIZED).json({
      message: error instanceof UnauthorizedError ? error.message : "Authentication Failure",
    });
    return;
  }
};

export const superAdminAuth = async (req: JwtPayload, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Kindly login" });
    return;
  }

  try {
    const decode = verifyJWT(token);

    if (!decode || !decode.email) {
      throw new UnauthorizedError("Authentication Failure");
    }

    const user = await adminService.getAdminByEmail(decode.email.toLowerCase());
    
    if (!user) {
      throw new UnauthorizedError("No user found");
    }
   if ( user.role !== AdminRolesEnum.superAdmin) {
  throw new UnauthorizedError("Super Admin access only");
}

    req.user = user;
    
    next();
    
  } catch (error) {
    console.error("Auth Error:", error);

    res.status(StatusCodes.UNAUTHORIZED).json({
      message: error instanceof UnauthorizedError ? error.message : "Authentication Failure",
    });
    return;
  }
};
