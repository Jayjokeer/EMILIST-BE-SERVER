import Transaction from "../models/transaction.model";

export const createTransaction = async (data: any)=>{
    return await Transaction.create(data);
};

export const fetchSingleTransaction = async (transactionId: string) =>{
    return await Transaction.findById(transactionId);
};

export const fetchUserTransactions = async (page: number, limit: number,userId: string)=>{
    const skip = (page - 1) * limit;

    return await Transaction.find({userId: userId})
    .skip(skip)
    .limit(limit);
}

export const adminFetchAllTransactions = async (page: number, limit: number)=>{
    const skip = (page - 1) * limit;

    return await Transaction.find()
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email userName profileImage level _id uniqueId');
}