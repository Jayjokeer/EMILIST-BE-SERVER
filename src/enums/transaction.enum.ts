export enum TransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
  };
export enum WalletEnum{
    NGN= 'NGN',
    USD = 'USD',
    GBP = 'GBP',
    EUR = 'EUR',
};

export enum TransactionEnum {
    pending = 'pending',
    completed = 'completed',
    declined = 'declined'
};

export enum TransactionServiceEnum {
    material = 'material',
    job = 'job'
};