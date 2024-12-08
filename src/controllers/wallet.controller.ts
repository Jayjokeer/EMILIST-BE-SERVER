import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as walletService from "../services/wallet.services";


export const createWalletController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
  const {currency, isDefault} = req.body;

 const data = await walletService.createNewWallet(userId, currency, isDefault); 
    return successResponse(res, StatusCodes.OK, data);
  });

const initiateWalletFunding =  catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
  const {currency, amount, paymentMethod} = req.body;

 const wallet= await walletService.findUserWalletByCurrency(userId, currency); 
    // return successResponse(res, StatusCodes.OK, data);
  });
