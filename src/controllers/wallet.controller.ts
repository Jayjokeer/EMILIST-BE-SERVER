import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as walletService from "../services/wallet.services";
import { BadRequestError, NotFoundError } from "../errors/error";
import * as transactionService from "../services/transaction.service";
import { fetchBanks, generatePaystackPaymentLink, verifyPaystackPayment } from "../utils/paystack";
import * as bankAccountService from "../services/bank-account.service";
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
  const {currency, amount, paymentMethod, walletId, redirectUrl} = req.body;
  const wallet = await walletService.findWallet(userId, currency, walletId);

  if (!wallet) throw new NotFoundError('Wallet not found');
  const transactionPayload = {
    userId,
    type: TransactionType.CREDIT,
    amount,
    description: `Wallet funding via ${paymentMethod}`,
    paymentMethod: paymentMethod,
    reference: paymentMethod === PaymentMethodEnum.card ? `PS-${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}` : `BT-${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    recieverId: userId,
    balanceBefore: wallet.balance,
    walletId,
    currency,
    serviceType: ServiceEnum.walletFunding,
  };
const transaction = await transactionService.createTransaction(transactionPayload);
  if (paymentMethod === PaymentMethodEnum.card && currency === WalletEnum.NGN ) {
    if(!redirectUrl){
      throw new BadRequestError("redirectUrl is required for card payments");
    }
    transaction.paymentService = PaymentServiceEnum.paystack;
    const paymentLink = await generatePaystackPaymentLink(transaction.reference, amount, req.user.email, redirectUrl);
    await transaction.save();
    const data = {
      authorizationUrl: paymentLink,
      reference: transaction.reference,
      transactionId: transaction._id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
    };
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

// === Wallet management ===

export const fetchWalletsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const wallets = await walletService.fetchUserWallets(req.user._id);
  const data = {
    wallets: wallets.map((wallet: any) => ({
      walletId: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency,
      isDefault: wallet.isDefault,
      createdAt: wallet.createdAt,
    })),
  };
  return successResponse(res, StatusCodes.OK, data);
});

export const fetchWalletDetailController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { wallet, bankAccount } = await walletService.fetchWalletDetail(req.user._id, req.params.walletId);
  const data = {
    walletId: wallet._id,
    balance: wallet.balance,
    currency: wallet.currency,
    isDefault: wallet.isDefault,
    createdAt: wallet.createdAt,
    bankAccount: bankAccount ? bankAccountService.serializeBankAccount(bankAccount) : null,
  };
  return successResponse(res, StatusCodes.OK, data);
});

export const setDefaultWalletController = catchAsync(async (req: JwtPayload, res: Response) => {
  const wallet = await walletService.setDefaultWallet(req.user._id, req.params.walletId);
  return successResponse(res, StatusCodes.OK, {
    walletId: wallet!._id,
    balance: wallet!.balance,
    currency: wallet!.currency,
    isDefault: wallet!.isDefault,
  });
});

// === Funding helpers ===

export const fetchPaymentMethodsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const data = {
    paymentMethods: [
      { id: PaymentMethodEnum.card, name: "Card", description: "Pay with your card via Paystack" },
      { id: PaymentMethodEnum.bankTransfer, name: "BankTransfer", description: "Fund via manual bank transfer with receipt" },
    ],
  };
  return successResponse(res, StatusCodes.OK, data);
});

// Bank list (code + name) for the add-bank-account screen
export const fetchBanksController = catchAsync(async (req: JwtPayload, res: Response) => {
  const banks = await fetchBanks("NGN");
  return successResponse(res, StatusCodes.OK, {
    banks: banks.map((bank: any) => ({ bankCode: bank.code, bankName: bank.name })),
  });
});

// === Payout bank accounts ===

export const fetchBankAccountsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const accounts = await bankAccountService.fetchUserBankAccounts(req.user._id);
  return successResponse(res, StatusCodes.OK, {
    bankAccounts: accounts.map((account: any) => bankAccountService.serializeBankAccount(account)),
  });
});

export const addBankAccountController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { bankCode, accountNumber, currency } = req.body;
  const account = await bankAccountService.addBankAccount(req.user._id, bankCode, accountNumber, currency);
  return successResponse(res, StatusCodes.CREATED, bankAccountService.serializeBankAccount(account));
});

// === Withdrawals (admin approval required before payout) ===

export const withdrawFundsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { amount, currency, bankAccountId } = req.body;

  const bankAccount = await bankAccountService.fetchBankAccountById(userId, bankAccountId);
  const { wallet, balanceBefore } = await walletService.debitWalletForWithdrawal(userId, currency, amount);

  try {
    const transaction = await transactionService.createTransaction({
      userId,
      type: TransactionType.DEBIT,
      amount,
      description: `Withdrawal to ${bankAccount.bankName} ${bankAccount.accountNumber}`,
      counterparty: `${bankAccount.bankName} - ${bankAccount.accountName}`,
      paymentMethod: PaymentMethodEnum.bankTransfer,
      reference: `WD-${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      balanceBefore,
      balanceAfter: wallet.balance,
      walletId: wallet._id,
      bankAccountId: bankAccount._id,
      currency,
      serviceType: ServiceEnum.withdrawal,
      status: TransactionEnum.pending,
    });
    return successResponse(res, StatusCodes.CREATED, {
      transactionId: transaction._id,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      balance: wallet.balance,
      counterparty: transaction.counterparty,
    });
  } catch (error) {
    // Release the hold if the transaction record fails to persist
    wallet.balance += amount;
    await wallet.save();
    throw error;
  }
});


 