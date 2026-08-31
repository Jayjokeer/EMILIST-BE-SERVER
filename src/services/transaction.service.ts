import mongoose from "mongoose";
import { PaymentMethodEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import Transaction from "../models/transaction.model";
import AppConfig from "../models/app-config.model";

export const createTransaction = async (data: any)=>{
    return await Transaction.create(data);
};

export const fetchSingleTransactionWithDetails = async (transactionId: string) =>{
    return await Transaction.findById(transactionId).populate('walletId').populate('userId', 'fullName email userName profileImage level _id uniqueId');
};
export const fetchSingleTransaction = async (transactionId: string) =>{
    return await Transaction.findById(transactionId);
};
export const fetchUserTransactions = async (page: number, limit: number,userId: string)=>{
    const skip = (page - 1) * limit;

    return await Transaction.find({userId: userId})
    .skip(skip)
    .limit(limit);
};

export const fetchTransactionByReference = async (reference: string)=>{
    return await Transaction.findOne({reference});
};

export const adminFetchAllTransactionsByStatus = async(status: TransactionEnum ,page: number, limit: number, serviceType?: ServiceEnum)=>{
    const skip = (page - 1) * limit;
    const query: any = { status };
    if (serviceType) query.serviceType = serviceType;
    const totalTransactions = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    return {
        transactions,
        totalTransactions,
        page,
    };
};

export const fetchAllTransactionsByUser = async(userId: string,page: number, limit: number,  paymentMethod:PaymentMethodEnum)=>{
    const skip = (page - 1) * limit;
    let queryPayload: any = {
      $or: [{ userId: userId }, { recieverId: userId }],
    };
      if(paymentMethod){
        if (paymentMethod === PaymentMethodEnum.wallet) {
          queryPayload = {
            $and: [
              { $or: [{ userId: userId }, { recieverId: userId }] },
              {
                $or: [
                  { paymentMethod: PaymentMethodEnum.wallet },
                  {
                    paymentMethod: PaymentMethodEnum.card,
                    serviceType: ServiceEnum.walletFunding,
                  },
                ],
              },
            ],
          };
          } else {
            queryPayload.paymentMethod = paymentMethod as PaymentMethodEnum;
          }
      };
    const totalTransactions = await Transaction.countDocuments(queryPayload);
    const transactions = await Transaction.find(queryPayload)
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    return {
        transactions,
        totalTransactions,
        page,
    };
};

export const totalCompletedJobsByTransaction = async (userId: string)=>{
    return await Transaction.countDocuments({
        userId,
        jobId: { $exists: true },
        status: TransactionEnum.completed,
      });
};

export const totalAmountByTransaction = async (userId: string)=>{
   return  await Transaction.aggregate([
        { $match: { userId, status: TransactionEnum.completed } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
};


export const fetchTransactionChartAdminDashboard = async (
  year?: number,
  currency?: WalletEnum
) => {
  const filter: any = {};

  if (year) {
    if (isNaN(year) || year < 1970 || year > new Date().getFullYear()) {
      throw new Error("Invalid year provided");
    }
  }
  
  const targetYear = year || new Date().getFullYear();
  const startOfYear = new Date(`${targetYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);
  
  filter.createdAt = {
    $gte: startOfYear,
    $lt: endOfYear,
  };

  if (currency) {
    filter.currency = currency;
  }

  try {
    const transactions = await Transaction.find(filter).lean();
    const totalsByCurrency: Record<string, number> = {};
    const transactionsByMonth: Record<string, Record<string, number>> = {};
    
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    Object.values(WalletEnum).forEach(curr => {
      totalsByCurrency[curr] = 0;
    });

    transactions.forEach((transaction) => {
      const { amount, currency, createdAt } = transaction;
      
      if (!currency || !amount) {
        console.warn("Missing currency or amount for transaction", transaction);
        return;
      }

      const standardizedCurrency = currency.toUpperCase();
      const amountNumber = Number(amount);
      const date = new Date(createdAt);

      if (isNaN(date.getTime())) {
        console.warn("Invalid date in transaction", transaction);
        return;
      }

      const month = date.toLocaleString("default", { month: "short" });
      const period = `${month} ${date.getFullYear()}`;

      totalsByCurrency[standardizedCurrency] = (totalsByCurrency[standardizedCurrency] || 0) + amountNumber;

      if (!transactionsByMonth[period]) {
        transactionsByMonth[period] = {};
        Object.values(WalletEnum).forEach(curr => {
          transactionsByMonth[period][curr] = 0;
        });
      }

      transactionsByMonth[period][standardizedCurrency] = 
        (transactionsByMonth[period][standardizedCurrency] || 0) + amountNumber;
    });

    const transactionsArray = months.map((month) => {
      const period = `${month} ${targetYear}`;
      const amounts = transactionsByMonth[period] || {};
      const result: Record<string, any> = { period };

      if (currency) {
        result[currency] = amounts[currency] || 0;
      } else {
        Object.values(WalletEnum).forEach(curr => {
          result[curr] = amounts[curr] || 0;
        });
      }

      return result;
    });

    return {
      totalsByCurrency,
      transactions: transactionsArray,
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Unable to fetch transactions");
  }
};




  export const fetchAllUserEarningsAdmin = async (userId: string) => {
    return await Transaction.aggregate([
      {
        $match: {
          recieverId: new mongoose.Types.ObjectId(userId), 
        },
      },
      {
        $group: {
          _id: '$currency', 
          totalEarnings: { $sum: '$amount' }, 
        },
      },
      {
        $project: {
          _id: 0, 
          currency: '$_id', 
          totalEarnings: 1, 
        },
      },
    ]);
  };
export const fetchTransactionsByService = async (userId: string, serviceType: ServiceEnum, )=>{
    return await Transaction.find({userId, serviceType});
};

export const fetchUserEarnings = async (userId: string, startDate: Date, endDate: Date )=>{
  return await Transaction.find({
    userId,
    dateCompleted: { $gte: startDate, $lte: endDate },
    status: TransactionEnum.completed,
  });
};

export const fetchAllTransactionsAdmin = async (limit: number, page: number, search: string) => {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const searchableFields = [
    'transactionId',
    'status',
    'type',
    'description',
    'currency',
  ];

  const searchQuery = search
    ? {
        $or: searchableFields.map((field) => ({
          [field]: { $regex: search, $options: 'i' }
        }))
      }
    : {};

  const [transactions, totalTransactions] = await Promise.all([
    Transaction.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('jobId')
      .populate('recieverId', '_id fullName')
      .populate('milestoneId')
      .populate('walletId', '_id')
      .populate('orderId')
      .populate('planId')
      .populate('userId', '_id fullName')
      .lean(),
    Transaction.countDocuments(searchQuery)
  ]);

  return {
    transactions,
    totalTransactions,
  };
};
export const fetchTransactionAdmin = async(transactionId: string) =>{
const transaction = await Transaction.findById(transactionId)
.populate('jobId')
.populate('recieverId', '_id fullName')
.populate('milestoneId')
.populate('walletId', '_id')
.populate('orderId')
.populate('planId')
.populate('userId', '_id fullName');

return transaction;
};

export const changeVatServiceAdmin  = async (vat: number)=>{
  return await AppConfig.updateOne({}, { $set: { vat } });
};

export const getVat = async ()=>{
  return await AppConfig.findOne();
};

export const fetchSingleTransactionByMilestoneId = async (milestoneId: string) =>{
  return await Transaction.findOne({
    milestoneId: milestoneId,
    status: TransactionEnum.processing
  });
};

export const fetchPriceForVerification = async()=>{
  return await AppConfig.findOne();
}

// Maps the API's status vocabulary (all|pending|failed|successful) onto the
// model's TransactionEnum values (pending/processing/completed/declined/failed)
const statusCondition = (status?: string) => {
  if (!status || status === "all") return null;
  if (status === "successful") return { status: TransactionEnum.completed };
  if (status === "failed") return { status: { $in: [TransactionEnum.failed, TransactionEnum.declined] } };
  if (status === "pending") return { status: { $in: [TransactionEnum.pending, TransactionEnum.processing] } };
  return null;
};

export const fetchUserTransactionsFiltered = async (
  userId: string,
  filters: { status?: string; type?: string; search?: string; paymentMethod?: string; page?: number; limit?: number }
) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
  const skip = (page - 1) * limit;

  const andConditions: any[] = [{ $or: [{ userId: userId }, { recieverId: userId }] }];

  const statusCond = statusCondition(filters.status);
  if (statusCond) andConditions.push(statusCond);
  if (filters.type === "inflow") andConditions.push({ type: TransactionType.CREDIT });
  if (filters.type === "outflow") andConditions.push({ type: TransactionType.DEBIT });
  if (filters.paymentMethod) andConditions.push({ paymentMethod: filters.paymentMethod });

  // Search by transaction reference/id or counterparty (falls back to description)
  if (filters.search?.trim()) {
    const search = filters.search.trim();
    const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    const searchConditions: any[] = [{ reference: regex }, { description: regex }, { counterparty: regex }];
    if (/^[a-f\d]{24}$/i.test(search)) searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    andConditions.push({ $or: searchConditions });
  }

  const query = { $and: andConditions };
  const [transactions, totalTransactions] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query),
  ]);

  return { transactions, totalTransactions, page, totalPages: Math.ceil(totalTransactions / limit) };
};

// Chart summary for a rolling window: monthly inflow/outflow totals, total
// transaction count and % change vs the previous equal-length period.
const RANGE_MONTHS: Record<string, number> = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 };

export const fetchTransactionSummary = async (userId: string, range: string) => {
  const months = RANGE_MONTHS[range] || 3;
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - (2 * months - 1), 1);
  const previousEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0, 23, 59, 59, 999);

  const buildWindowTotals = async (start: Date, end: Date) => {
    const rows = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const inflow = rows.find((row: any) => row._id === TransactionType.CREDIT)?.total || 0;
    const outflow = rows.find((row: any) => row._id === TransactionType.DEBIT)?.total || 0;
    const count = rows.reduce((sum: number, row: any) => sum + row.count, 0);
    return { inflow, outflow, count };
  };

  const monthlyRows = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: currentStart, $lte: now } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const monthly: { month: string; inflow: number; outflow: number }[] = [];
  for (let i = 0; i < months; i++) {
    const bucket = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const inflow = monthlyRows.find((row: any) => row._id.year === bucket.getFullYear() && row._id.month === bucket.getMonth() + 1 && row._id.type === TransactionType.CREDIT)?.total || 0;
    const outflow = monthlyRows.find((row: any) => row._id.year === bucket.getFullYear() && row._id.month === bucket.getMonth() + 1 && row._id.type === TransactionType.DEBIT)?.total || 0;
    monthly.push({
      month: `${bucket.toLocaleString("en-US", { month: "short" })} ${bucket.getFullYear()}`,
      inflow,
      outflow,
    });
  }

  const current = await buildWindowTotals(currentStart, now);
  const previous = await buildWindowTotals(previousStart, previousEnd);

  const currentVolume = current.inflow + current.outflow;
  const previousVolume = previous.inflow + previous.outflow;
  const percentageChange = previousVolume === 0
    ? (currentVolume > 0 ? 100 : 0)
    : Number((((currentVolume - previousVolume) / previousVolume) * 100).toFixed(2));

  return {
    range,
    totalTransactions: current.count,
    inflowTotal: current.inflow,
    outflowTotal: current.outflow,
    percentageChange,
    monthly,
  };
};

export const fetchUserTransactionById = async (userId: string, transactionId: string) => {
  return await Transaction.findOne({
    _id: transactionId,
    $or: [{ userId: userId }, { recieverId: userId }],
  }).populate("walletId", "currency balance");
};

export const fetchTransactionsForStatement = async (userId: string, startDate?: Date, endDate?: Date, status?: string) => {
  const andConditions: any[] = [{ $or: [{ userId: userId }, { recieverId: userId }] }];
  const createdAt: any = {};
  if (startDate) createdAt.$gte = startDate;
  if (endDate) createdAt.$lte = endDate;
  if (Object.keys(createdAt).length) andConditions.push({ createdAt });
  const statusCond = statusCondition(status);
  if (statusCond) andConditions.push(statusCond);
  return await Transaction.find({ $and: andConditions }).sort({ createdAt: 1 }).lean();
};

// Webhook idempotency helpers: mark by reference without saving so the caller
// decides (and can guard) before persisting.
export const markTransactionCompletedByReference = async (reference?: string) => {
  if (!reference) return null;
  const transaction = await Transaction.findOne({ reference });
  if (!transaction) return null;
  if (transaction.status === TransactionEnum.completed) return { transaction, alreadyProcessed: true };
  transaction.status = TransactionEnum.completed;
  transaction.dateCompleted = new Date();
  return { transaction, alreadyProcessed: false };
};

export const markTransactionFailedByReference = async (reference?: string) => {
  if (!reference) return null;
  const transaction = await Transaction.findOne({ reference });
  if (!transaction) return null;
  if (transaction.status === TransactionEnum.failed) return { transaction, alreadyProcessed: true };
  transaction.status = TransactionEnum.failed;
  transaction.dateCompleted = new Date();
  return { transaction, alreadyProcessed: false };
};