import { Response } from "express";

export const successResponse = (
    res: Response,
    statusCode: number,
    data?: any,
    pinId?:any,
  ) => {
    return res.status(statusCode).json({
      message: "success",
      data,
      pinId,
    });
  };
  