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
    declined = 'declined',
    failed = 'failed',
};

export enum TransactionServiceEnum {
    material = 'material',
    job = 'job'
};

export enum PaymentMethodEnum {
    card= 'Card',
    bankTransfer = 'BankTransfer'
};
export enum PaymentServiceEnum {
    paystack= 'Paystack',
    stripe = 'Stripe',
    // flutterwave = 'Flutterwave',
};