import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as walletService from "../services/wallet.services";
import { NotFoundError } from "../errors/error";
import * as transactionService from "../services/transaction.service";
import { generatePaystackPaymentLink, verifyPaystackPayment } from "../utils/paystack";
import { PaymentMethodEnum, PaymentServiceEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import * as userService from "../services/auth.service";

export const createWalletController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
  const {currency, isDefault} = req.body;

 const data = await walletService.createNewWallet(userId, currency, isDefault); 
 const user = await userService.findUserById(userId);
 user?.wallets?.push(data._id);
 await user?.save()
    return successResponse(res, StatusCodes.CREATED, data);
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
    reference: paymentMethod === PaymentMethodEnum.card ? `PS-${Date.now()}` : `BT-${Date.now()}`,
    recieverId: userId,
    balanceBefore: wallet.balance,
    walletId,
    currency,
    serviceType: ServiceEnum.walletFunding,
  };
const transaction = await transactionService.createTransaction(transactionPayload);
  if (paymentMethod === PaymentMethodEnum.card && currency === WalletEnum.NGN ) {
    transaction.paymentService = PaymentServiceEnum.paystack;
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

  export const verifyBankTransferWalletFunding =  catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {transactionId, status} = req.body;
    let message;
    const transaction = await transactionService.fetchSingleTransaction(transactionId);
     if (!transaction || transaction.paymentMethod !== PaymentMethodEnum.bankTransfer) {
      throw new Error('Transaction not found or not a bank transfer');
    }
    const wallet = await walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
    if(!wallet){
      throw new NotFoundError("Wallet not found!")
    };
    if (transaction.status === TransactionEnum.completed) {
      throw new Error('Transaction is already completed');
    }
  
    transaction.adminApproval = true;
  
    if(status === "Approved"){
      transaction.status = TransactionEnum.completed;
      transaction.adminApproval = true;
      transaction.balanceAfter = wallet.balance + transaction.amount;

      await Promise.all([ transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
    }else if (status === "Declined"){
      transaction.status = TransactionEnum.declined;
      await transaction.save();
    }

    return successResponse(res, StatusCodes.OK, message);
  });


 