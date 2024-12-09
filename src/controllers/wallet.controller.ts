import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as walletService from "../services/wallet.services";
import { NotFoundError } from "../errors/error";
import * as transactionService from "../services/transaction.service";
import { generatePaystackPaymentLink } from "../utils/paystack";
import { TransactionType } from "../enums/transaction.enum";

export const createWalletController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
  const {currency, isDefault} = req.body;

 const data = await walletService.createNewWallet(userId, currency, isDefault); 
    return successResponse(res, StatusCodes.OK, data);
  });

export const initiateWalletFunding =  catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
  const {currency, amount, paymentMethod, walletId} = req.body;
  const wallet = await walletService.findWallet(userId, currency, walletId);

  if (!wallet) throw new NotFoundError('Wallet not found');
  const transactionPayload = {
    userId,
    type: TransactionType.CREDIT,
    amount,
    description: `Wallet funding via ${paymentMethod}`,
    paymentMethod: paymentMethod,
    reference: paymentMethod === 'Paystack' ? `PS-${Date.now()}` : `BT-${Date.now()}`,
    recieverId: userId,
    balanceAfter: wallet.balance,
  };
const transaction = await transactionService.createTransaction(transactionPayload);
  if (paymentMethod === 'Paystack') {
    const paymentLink = await generatePaystackPaymentLink(transaction.reference, amount, req.user.email);
    const data = { paymentLink, transaction };
    return successResponse(res, StatusCodes.CREATED, data);
  }else{
    if (req.file) {
      transaction.transferReceipt = req.file.path;
   };
    await transaction.save();
    return successResponse(res, StatusCodes.CREATED, "Wallet funding initiated successfully");
  }
  });

  // export const verifyBankTransferWalletFunding =  catchAsync(async (req: JwtPayload, res: Response) => {
  //   const userId = req.user._id;
  //   const transaction = await transactionService. (transactionPayload);

  //   if (req.file) {
  //     transaction.transferReceipt = req.file.path;
  //  };
  //   await transaction.save();
  //   return successResponse(res, StatusCodes.CREATED, "Wallet funding initiated successfully");
  // }
  // });
