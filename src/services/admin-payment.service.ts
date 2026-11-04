import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/error";
import Transaction from "../models/transaction.model";
import Wallet from "../models/wallet.model";
import Users from "../models/users.model";
import AdminAction from "../models/admin-action.model";
import { PaymentMethodEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import { overviewRange, percentageChange } from "./admin-overview.service";
import * as walletService from "./wallet.services";

export const adminPaymentPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(1, Number(pageValue) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

export const adminPaymentDirection = (transaction: any) =>
  transaction.type === TransactionType.CREDIT ? "inflow" : "outflow";

const assertId = (value: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestError(`Invalid ${label}`);
};

const amountAggregate = async (model: any, match: any, amountField = "$amount") => {
  const rows = await model.aggregate([
    { $match: match },
    { $group: { _id: null, amount: { $sum: amountField }, count: { $sum: 1 } } },
  ]);
  return { amount: rows[0]?.amount || 0, count: rows[0]?.count || 0 };
};

const comparison = async (match: any, range: ReturnType<typeof overviewRange>, dateField = "createdAt") => {
  const [current, previous] = await Promise.all([
    amountAggregate(Transaction, { ...match, [dateField]: { $gte: range.currentStart, $lte: range.currentEnd } }),
    amountAggregate(Transaction, { ...match, [dateField]: { $gte: range.previousStart, $lt: range.previousEnd } }),
  ]);
  return {
    currentAmount: current.amount, previousAmount: previous.amount,
    currentCount: current.count, previousCount: previous.count,
    percentageChange: percentageChange(current.amount, previous.amount),
  };
};

export const fetchAdminPaymentSummary = async (rangeValue?: string, currencyValue?: string) => {
  const range = overviewRange(rangeValue);
  const currency = Object.values(WalletEnum).includes(currencyValue as WalletEnum)
    ? currencyValue as WalletEnum : WalletEnum.NGN;
  const escrowMatch: any = {
    currency,
    isSettled: false,
    status: { $in: [TransactionEnum.completed, TransactionEnum.processing] },
    $or: [{ jobId: { $exists: true, $ne: null } }, { orderId: { $exists: true, $ne: null } }],
  };
  const withdrawalMatch = { currency, serviceType: ServiceEnum.withdrawal, status: TransactionEnum.pending };
  const failedMatch = { currency, status: { $in: [TransactionEnum.failed, TransactionEnum.declined] } };
  const volumeMatch = { currency, status: TransactionEnum.completed };

  const [escrow, escrowRecords, walletRows, walletNetRows, pendingWithdrawals, failedTransactions, grossVolume, escrowChange, withdrawalChange, failedChange, volumeChange] = await Promise.all([
    amountAggregate(Transaction, escrowMatch),
    Transaction.aggregate([
      { $match: escrowMatch },
      { $project: { recordId: { $ifNull: ["$jobId", "$orderId"] } } },
      { $match: { recordId: { $ne: null } } },
      { $group: { _id: "$recordId" } },
      { $count: "count" },
    ]),
    Wallet.aggregate([{ $match: { currency } }, { $group: { _id: null, amount: { $sum: "$balance" }, count: { $sum: 1 } } }]),
    Transaction.aggregate([
      { $match: { currency, status: TransactionEnum.completed, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } } },
      { $group: {
        _id: null,
        credits: { $sum: { $cond: [{ $eq: ["$type", TransactionType.CREDIT] }, "$amount", 0] } },
        debits: { $sum: { $cond: [{ $eq: ["$type", TransactionType.DEBIT] }, "$amount", 0] } },
      } },
    ]),
    amountAggregate(Transaction, withdrawalMatch),
    amountAggregate(Transaction, { ...failedMatch, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
    amountAggregate(Transaction, { ...volumeMatch, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
    comparison(escrowMatch, range),
    comparison(withdrawalMatch, range),
    comparison(failedMatch, range),
    comparison(volumeMatch, range),
  ]);
  const userBalanceAmount = walletRows[0]?.amount || 0;
  const walletNetChange = (walletNetRows[0]?.credits || 0) - (walletNetRows[0]?.debits || 0);
  const estimatedPreviousBalance = userBalanceAmount - walletNetChange;
  const userBalance = {
    amount: userBalanceAmount,
    wallets: walletRows[0]?.count || 0,
    estimatedPreviousBalance,
    change: percentageChange(userBalanceAmount, estimatedPreviousBalance),
  };
  return {
    range: range.range,
    currency,
    totalEscrowBalance: { ...escrow, activeRecords: escrowRecords[0]?.count || 0, change: escrowChange.percentageChange },
    totalUserBalance: userBalance,
    pendingWithdrawals: { ...pendingWithdrawals, requests: pendingWithdrawals.count, change: withdrawalChange.percentageChange },
    failedTransactions: { ...failedTransactions, value: failedTransactions.amount, change: failedChange.percentageChange },
    grossTransactionVolume: { ...grossVolume, change: volumeChange.percentageChange },
  };
};

const paymentFilter = async (query: any) => {
  const filter: any = {};
  if (query.currency) filter.currency = query.currency;
  if (query.type) filter.type = String(query.type).toUpperCase();
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.serviceType) filter.serviceType = query.serviceType;
  if (query.status) {
    switch (String(query.status)) {
      case "successful": filter.status = TransactionEnum.completed; break;
      case "pending": filter.status = { $in: [TransactionEnum.pending, TransactionEnum.processing] }; break;
      case "failed": filter.status = { $in: [TransactionEnum.failed, TransactionEnum.declined] }; break;
      default: filter.status = query.status;
    }
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(String(query.startDate));
    if (query.endDate) {
      const end = new Date(String(query.endDate));
      end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  const search = String(query.search || "").trim();
  if (search) {
    const users = await Users.find({ $or: [
      { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
    ] }).select("_id").lean();
    filter.$or = [
      { reference: { $regex: search, $options: "i" } }, { counterparty: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }, { userId: { $in: users.map((user: any) => user._id) } },
      { recieverId: { $in: users.map((user: any) => user._id) } },
      ...(Types.ObjectId.isValid(search) ? [{ _id: new Types.ObjectId(search) }] : []),
    ];
  }
  return filter;
};

const personName = (person: any) => person
  ? [person.firstName, person.lastName].filter(Boolean).join(" ") || person.userName || person.email || null
  : null;

export const serializeAdminPayment = (transaction: any) => {
  const sender = transaction.userId;
  const receiver = transaction.recieverId;
  const direction = adminPaymentDirection(transaction);
  const counterparty = transaction.counterparty
    || (direction === "inflow" ? personName(sender) : personName(receiver))
    || personName(receiver) || personName(sender) || null;
  return {
    id: transaction._id,
    transactionId: transaction.reference || String(transaction._id),
    date: transaction.dateCompleted || transaction.createdAt,
    counterparty,
    direction,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency || WalletEnum.NGN,
    paymentMethod: transaction.paymentMethod,
    status: transaction.status,
    description: transaction.description,
    serviceType: transaction.serviceType,
    balanceBefore: transaction.balanceBefore,
    balanceAfter: transaction.balanceAfter,
    jobId: transaction.jobId?._id || transaction.jobId || null,
    orderId: transaction.orderId?._id || transaction.orderId || null,
    sender,
    receiver,
  };
};

const populatedPayments = (query: any) => query
  .populate("userId", "firstName lastName userName email uniqueId displayImage")
  .populate("recieverId", "firstName lastName userName email uniqueId displayImage")
  .populate("jobId", "title status")
  .populate("orderId", "paymentStatus deliveryStatus totalAmount");

export const fetchAdminPayments = async (query: any) => {
  const { page, limit, skip } = adminPaymentPagination(query.page, query.limit);
  const filter = await paymentFilter(query);
  const [transactions, total] = await Promise.all([
    populatedPayments(Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)).lean(),
    Transaction.countDocuments(filter),
  ]);
  return {
    transactions: transactions.map(serializeAdminPayment),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const fetchAdminPayment = async (transactionId: string) => {
  assertId(transactionId, "transaction id");
  const transaction: any = await populatedPayments(Transaction.findById(transactionId)).lean();
  if (!transaction) throw new NotFoundError("Transaction not found");
  return serializeAdminPayment(transaction);
};

export const fetchAdminWithdrawals = async (query: any) => fetchAdminPayments({
  ...query,
  serviceType: ServiceEnum.withdrawal,
});

export const processAdminWithdrawal = async (transactionId: string, adminId: string, decision: "approve" | "decline", reason: string) => {
  assertId(transactionId, "transaction id");
  const before: any = await Transaction.findById(transactionId).lean();
  if (!before) throw new NotFoundError("Transaction not found");
  const transaction: any = decision === "approve"
    ? await walletService.approveWithdrawal(transactionId)
    : await walletService.declineWithdrawal(transactionId);
  await AdminAction.create({
    adminId, targetUserId: transaction.userId, targetType: "transaction", targetId: transaction._id,
    action: `withdrawal.${decision}d`, reason,
    previousState: { status: before.status, adminApproval: before.adminApproval },
    newState: { status: transaction.status, adminApproval: transaction.adminApproval, transferCode: transaction.transferCode },
  });
  return fetchAdminPayment(transactionId);
};
