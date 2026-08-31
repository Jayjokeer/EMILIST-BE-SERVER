import { ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import { BadRequestError, NotFoundError } from "../errors/error";
import Wallet from "../models/wallet.model";
import BankAccount from "../models/bank-account.model";
import * as transactionService from "../services/transaction.service";
import { initiateTransfer } from "../utils/paystack";

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
    try{
      const wallet = await Wallet.findById({_id:walletId});
    if (!wallet) throw new Error('Wallet not found');
  
    wallet.balance += amount;
    await wallet.save();
  
    return wallet;
  }catch(error){
    console.log(error)
  };
}

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
    if (!wallet) throw new NotFoundError('Wallet not found');
  
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

export const fetchUserWallets = async (userId: string) => {
  return await Wallet.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
};

export const fetchWalletDetail = async (userId: string, walletId: string) => {
  const wallet = await Wallet.findOne({ _id: walletId, userId });
  if (!wallet) throw new NotFoundError("Wallet not found");
  const bankAccount = await BankAccount.findOne({ userId, isDefault: true }) || await BankAccount.findOne({ userId }).sort({ createdAt: -1 });
  return { wallet, bankAccount };
};

// Withdrawals hold (debit) the funds immediately so they cannot be spent while
// the withdrawal awaits admin approval; declined/failed transfers refund it.
export const debitWalletForWithdrawal = async (userId: string, currency: WalletEnum, amount: number) => {
  const wallet = await Wallet.findOne({ userId, currency });
  if (!wallet) throw new NotFoundError(`No wallet found for currency: ${currency}`);
  if (wallet.balance < amount) throw new BadRequestError("Insufficient wallet balance");
  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  await wallet.save();
  return { wallet, balanceBefore };
};

const refundTransactionToWallet = async (transaction: any) => {
  if (transaction.isRefunded) return;
  const wallet = await Wallet.findById(transaction.walletId);
  if (!wallet) return;
  wallet.balance += transaction.amount;
  await wallet.save();
  transaction.isRefunded = true;
  transaction.balanceAfter = wallet.balance;
};

// transfer.failed / transfer.reversed webhook handler
export const refundFailedWithdrawalByReference = async (reference?: string) => {
  if (!reference) return;
  const transaction = await transactionService.fetchTransactionByReference(reference);
  if (!transaction) return;
  if (transaction.status === TransactionEnum.failed) return; // already refunded/processed
  transaction.status = TransactionEnum.failed;
  transaction.dateCompleted = new Date();
  await refundTransactionToWallet(transaction);
  await transaction.save();
};

// Admin approves a pending withdrawal -> Paystack transfer goes out
export const approveWithdrawal = async (transactionId: string) => {
  const transaction = await transactionService.fetchSingleTransaction(transactionId);
  if (!transaction) throw new NotFoundError("Transaction not found");
  if (transaction.serviceType !== ServiceEnum.withdrawal) throw new BadRequestError("This is not a withdrawal transaction");
  if (transaction.status !== TransactionEnum.pending) throw new BadRequestError("Withdrawal has already been processed");

  const bankAccount = await BankAccount.findById(transaction.bankAccountId);
  if (!bankAccount) throw new NotFoundError("Bank account not found for this withdrawal");

  transaction.adminApproval = true;
  transaction.status = TransactionEnum.processing;
  try {
    const transfer = await initiateTransfer(transaction.amount, bankAccount.recipientCode, transaction.reference, transaction.description || undefined);
    transaction.transferCode = transfer.transfer_code;
  } catch (error) {
    transaction.status = TransactionEnum.failed;
    await refundTransactionToWallet(transaction);
    await transaction.save();
    throw new BadRequestError(`Could not initiate Paystack transfer: ${(error as any)?.response?.data?.message || (error as Error).message}`);
  }
  await transaction.save();
  return transaction;
};

// Admin declines a pending withdrawal -> held amount is refunded
export const declineWithdrawal = async (transactionId: string) => {
  const transaction = await transactionService.fetchSingleTransaction(transactionId);
  if (!transaction) throw new NotFoundError("Transaction not found");
  if (transaction.serviceType !== ServiceEnum.withdrawal) throw new BadRequestError("This is not a withdrawal transaction");
  if (transaction.status !== TransactionEnum.pending) throw new BadRequestError("Withdrawal has already been processed");

  transaction.adminApproval = true;
  transaction.status = TransactionEnum.declined;
  await refundTransactionToWallet(transaction);
  await transaction.save();
  return transaction;
};