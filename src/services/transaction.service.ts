import { PaymentMethodEnum, TransactionEnum } from "../enums/transaction.enum";
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

    const totalTransactions = await Transaction.countDocuments({userId, paymentMethod});
    const transactions = await Transaction.find({userId, paymentMethod})
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
