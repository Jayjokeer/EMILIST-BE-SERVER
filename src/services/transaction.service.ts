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

export const adminFetchAllTransactions = async (page: number, limit: number)=>{
    const skip = (page - 1) * limit;

    return await Transaction.find()
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email userName profileImage level _id uniqueId');
};
export const fetchTransactionByReference = async (reference: string)=>{
    return await Transaction.findOne({reference});
}
// export const approveBankTransfer = async (transactionId: string, adminId: string) => {
//     const transaction = await Transaction.findById(transactionId);
//     if (!transaction || transaction.paymentMethod !== 'BankTransfer') {
//       throw new Error('Transaction not found or not a bank transfer');
//     }
  
//     if (transaction.status === 'completed') {
//       throw new Error('Transaction is already completed');
//     }
  
//     transaction.status = 'completed';
//     transaction.adminApproval = true;
  
//     // Update wallet balance
//     const wallet = await Wallet.findOne({ userId: transaction.userId });
//     wallet!.balance += transaction.amount;
  
//     // Save changes
//     await Promise.all([transaction.save(), wallet!.save()]);
  
//     return transaction;
//   };
  