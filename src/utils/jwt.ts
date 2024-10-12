import { Request } from "express";
import jwt from "jsonwebtoken";
import { BadRequestError } from "../errors/error";
import { ISignUser } from "../interfaces/user.interface";


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
