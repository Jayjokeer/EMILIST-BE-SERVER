import mongoose from "mongoose";
import { PaymentMethodEnum, ServiceEnum, TransactionEnum, WalletEnum } from "../enums/transaction.enum";
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

export const adminFetchAllTransactionsByStatus = async(status: TransactionEnum ,page: number, limit: number)=>{
    const skip = (page - 1) * limit;
    const totalTransactions = await Transaction.countDocuments({status});
    const transactions = await Transaction.find({status})
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