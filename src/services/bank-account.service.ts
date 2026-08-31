import BankAccount from "../models/bank-account.model";
import { BadRequestError, NotFoundError } from "../errors/error";
import { createTransferRecipient, fetchBanks, resolveBankAccount } from "../utils/paystack";
import { WalletEnum } from "../enums/transaction.enum";

// Standard payout-account shape used across responses
export const serializeBankAccount = (account: any) => ({
  bankAccountId: account._id,
  bankName: account.bankName,
  accountNumber: account.accountNumber,
  accountName: account.accountName,
  currency: account.currency,
  isDefault: account.isDefault,
});

export const addBankAccount = async (
  userId: string,
  bankCode: string,
  accountNumber: string,
  currency: WalletEnum = WalletEnum.NGN
) => {
  const duplicate = await BankAccount.findOne({ userId, bankCode, accountNumber });
  if (duplicate) throw new BadRequestError("This bank account has already been added");

  // Resolve the account on Paystack so we store the verified account name
  const resolved = await resolveBankAccount(accountNumber, bankCode);
  const banks = await fetchBanks(currency);
  const bank = banks.find((b: any) => String(b.code) === String(bankCode));
  if (!bank) throw new BadRequestError("Unknown bank code");

  // Transfer recipient is created once and reused for every payout
  const recipientCode = await createTransferRecipient(resolved.accountName, accountNumber, bankCode, currency);

  const hasDefault = await BankAccount.exists({ userId, isDefault: true });
  const account = await BankAccount.create({
    userId,
    bankName: bank.name,
    bankCode,
    accountNumber,
    accountName: resolved.accountName,
    recipientCode,
    currency,
    isDefault: !hasDefault,
  });
  return account;
};

export const fetchUserBankAccounts = async (userId: string) => {
  return await BankAccount.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

export const fetchBankAccountById = async (userId: string, bankAccountId: string) => {
  const account = await BankAccount.findOne({ _id: bankAccountId, userId });
  if (!account) throw new NotFoundError("Bank account not found");
  return account;
};

export const getDefaultBankAccount = async (userId: string) => {
  return (await BankAccount.findOne({ userId, isDefault: true })) || (await BankAccount.findOne({ userId }).sort({ createdAt: -1 }));
};