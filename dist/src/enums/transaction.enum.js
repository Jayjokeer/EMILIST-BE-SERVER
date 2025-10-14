"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceEnum = exports.PaymentServiceEnum = exports.PaymentMethodEnum = exports.TransactionServiceEnum = exports.TransactionEnum = exports.WalletEnum = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "CREDIT";
    TransactionType["DEBIT"] = "DEBIT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
;
var WalletEnum;
(function (WalletEnum) {
    WalletEnum["NGN"] = "NGN";
    WalletEnum["USD"] = "USD";
    WalletEnum["GBP"] = "GBP";
    WalletEnum["EUR"] = "EUR";
})(WalletEnum || (exports.WalletEnum = WalletEnum = {}));
;
var TransactionEnum;
(function (TransactionEnum) {
    TransactionEnum["pending"] = "pending";
    TransactionEnum["completed"] = "completed";
    TransactionEnum["declined"] = "declined";
    TransactionEnum["failed"] = "failed";
    TransactionEnum["processing"] = "processing";
})(TransactionEnum || (exports.TransactionEnum = TransactionEnum = {}));
;
var TransactionServiceEnum;
(function (TransactionServiceEnum) {
    TransactionServiceEnum["material"] = "material";
    TransactionServiceEnum["job"] = "job";
})(TransactionServiceEnum || (exports.TransactionServiceEnum = TransactionServiceEnum = {}));
;
var PaymentMethodEnum;
(function (PaymentMethodEnum) {
    PaymentMethodEnum["card"] = "Card";
    PaymentMethodEnum["bankTransfer"] = "BankTransfer";
    PaymentMethodEnum["wallet"] = "Wallet";
})(PaymentMethodEnum || (exports.PaymentMethodEnum = PaymentMethodEnum = {}));
;
var PaymentServiceEnum;
(function (PaymentServiceEnum) {
    PaymentServiceEnum["paystack"] = "Paystack";
    PaymentServiceEnum["stripe"] = "Stripe";
    // flutterwave = 'Flutterwave',
})(PaymentServiceEnum || (exports.PaymentServiceEnum = PaymentServiceEnum = {}));
;
var ServiceEnum;
(function (ServiceEnum) {
    ServiceEnum["job"] = "Job";
    ServiceEnum["material"] = "Material";
    ServiceEnum["walletFunding"] = "Walletfunding";
    ServiceEnum["subscription"] = "Subscription";
    ServiceEnum["verification"] = "verification";
})(ServiceEnum || (exports.ServiceEnum = ServiceEnum = {}));
;
