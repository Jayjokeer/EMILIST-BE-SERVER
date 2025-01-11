import mongoose from "mongoose";
import { PaymentMethodEnum, ServiceEnum, TransactionEnum, WalletEnum } from "../enums/transaction.enum";
import Transaction from "../models/transaction.model";

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
   let queryPayload: any= {
        userId: userId
      };
      if(paymentMethod){
        if (paymentMethod === PaymentMethodEnum.wallet) {
            queryPayload = {
              userId: userId,
              $or: [
                { paymentMethod: PaymentMethodEnum.wallet }, 
                {
                  paymentMethod: PaymentMethodEnum.card,
                  serviceType: ServiceEnum.walletFunding, 
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
export const fetchTransactionChartAdminDashboard = async(year: number, currency: WalletEnum)=>{
  const match: any = {};

  if (year) {
    match.dateCompleted = {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    };
  } else {
    match.dateCompleted = { $ne: null };
  }

  if (currency) {
    match.currency = currency;
  }

  const aggregation = [
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: '$dateCompleted' },
          currency: '$currency',
        },
        totalTransactions: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.currency',
        transactionsByMonth: {
          $push: {
            month: '$_id.month',
            totalTransactions: '$totalTransactions',
          },
        },
      },
    },
    {
      $project: {
        currency: '$_id',
        _id: 0,
        transactionsByMonth: {
          $arrayToObject: {
            $map: {
              input: '$transactionsByMonth',
              as: 'item',
              in: {
                k: {
                  $let: {
                    vars: { months: [null, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
                    in: { $arrayElemAt: ['$$months', '$$item.month'] },
                  },
                },
                v: '$$item.totalTransactions',
              },
            },
          },
        },
      },
    },
  ];

  const result = await Transaction.aggregate(aggregation);

  if (currency) {
    return result.find((item) => item.currency === currency)?.transactionsByMonth || {};
  }

  return result.reduce((acc, item) => {
    acc[item.currency] = item.transactionsByMonth;
    return acc;
  }, {});}

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
}