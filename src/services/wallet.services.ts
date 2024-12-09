import { TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import { BadRequestError } from "../errors/error";
import Wallet from "../models/wallet.model";
import * as transactionService from "../services/transaction.service";

export const createWallet= async(data: any)=>{
    return await Wallet.create(data);
};
export const findWalletById = async(walletId: string)=>{
  return await Wallet.findById(walletId);
}
export const findUserWallet = async (userId: string)=>{
    return await Wallet.findOne({userId: userId});
};
export const findUserWalletByCurrency = async (userId: string, currency : WalletEnum)=>{
    return await Wallet.findOne({userId: userId, currency: currency});
};
export const findWallet= async (userId: string, currency: WalletEnum, walletId: string)=>{
  return await Wallet.findOne({userId: userId, currency: currency, _id: walletId});
}
export const fundWallet = async (walletId: string, amount: number) => {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) throw new Error('Wallet not found');
  
    wallet.balance += amount;
    await wallet.save();
  
    return wallet;
  };
  

export const createNewWallet = async (userId: string, currency: WalletEnum, isDefault = false) => {
    const existingWallet = await Wallet.findOne({ userId, currency });
    if (existingWallet) throw new BadRequestError(`Wallet for ${currency} already exists`);
  
    if (isDefault) {
      await Wallet.updateMany({ userId }, { isDefault: false });
    }
  
    const wallet = await Wallet.create({ userId, currency, isDefault });
    return wallet;
};

export const setDefaultWallet = async (userId: string, walletId: string) => {
    const wallet = await Wallet.findOne({ _id: walletId, userId });
    if (!wallet) throw new Error('Wallet not found');
  
    await Wallet.updateMany({ userId }, { isDefault: false });
  
    wallet.isDefault = true;
    await wallet.save();
  
    return wallet;
  };
  
  export const payWithWallet = async (
    userId: string,
    amount: number,
    currency: string,
    description: string,
    receiverId: string,
    productId?: string,
    quantity?: number,
    jobId?: string,
  ) => {
    const wallet = await Wallet.findOne({ userId, currency });
    if (!wallet) throw new Error(`No wallet found for currency: ${currency}`);
  
    if (wallet.balance < amount) throw new Error('Insufficient funds');
  
    wallet.balance -= amount;
    await wallet.save();
  
   const transactionPayload = {
      userId,
      type: TransactionType.DEBIT,
      amount,
      description: `Payment using ${currency} wallet`,
      balanceAfter: wallet.balance,
      status: TransactionEnum.pending,
      recieverId: receiverId, 
      jobId,
      quantity,
      productId,
    };
  await transactionService.createTransaction(transactionPayload);
    return wallet;
  };
  