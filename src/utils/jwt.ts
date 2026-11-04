import { Request } from "express";
import jwt from "jsonwebtoken";
import { BadRequestError } from "../errors/error";
import { ISignUser } from "../interfaces/user.interface";

type AdminTokenPurpose = "admin_mfa_login" | "admin_mfa_enrollment";

interface AdminFlowToken {
  id: string;
  email: string;
  purpose: AdminTokenPurpose;
}


export const generateJWTwithExpiryDate = (
  payload: ISignUser
) => {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const userJWT = jwt.sign({ ...payload, exp }, process.env.JWT_SECRET!);

  return userJWT;
};

export const verifyJWT = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as ISignUser;
    return payload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new BadRequestError("Kindly log in!");
    } else {
      throw new BadRequestError("This token is invalid");
    }
  }
};

export const generateAdminFlowToken = (
  payload: AdminFlowToken,
  expiresIn: string | number = "5m",
) => jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn } as jwt.SignOptions);

export const verifyAdminFlowToken = (
  token: string,
  purpose: AdminTokenPurpose,
): AdminFlowToken => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AdminFlowToken;
    if (payload.purpose !== purpose) throw new Error("Invalid token purpose");
    return payload;
  } catch (error) {
    throw new BadRequestError(
      error instanceof jwt.TokenExpiredError ? "Challenge expired, please sign in again" : "Invalid challenge token",
    );
  }
};
