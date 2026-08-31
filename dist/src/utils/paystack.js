"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateTransfer = exports.createTransferRecipient = exports.fetchBanks = exports.resolveBankAccount = exports.verifyPaystackWebhookSignature = exports.verifyPaystackPayment = exports.generatePaystackPaymentLink = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("./config");
const generatePaystackPaymentLink = async (reference, amount, email, redirectUrl) => {
    const payload = {
        reference,
        amount: amount * 100,
        email: email,
    };
    if (redirectUrl) {
        payload.callback_url = redirectUrl;
        payload.cancel_url = redirectUrl;
    }
    const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', payload, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.authorization_url;
};
exports.generatePaystackPaymentLink = generatePaystackPaymentLink;
const verifyPaystackPayment = async (reference) => {
    const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.status === 'success' ? 'success' : 'failed';
};
exports.verifyPaystackPayment = verifyPaystackPayment;
// Paystack signs every webhook with HMAC-SHA512 of the raw request body using
// the secret key. The raw Buffer body (not the parsed JSON) must be used.
const verifyPaystackWebhookSignature = (rawBody, signature) => {
    if (!config_1.config.paystackSecretKey || !rawBody || !signature)
        return false;
    const hash = crypto_1.default.createHmac("sha512", config_1.config.paystackSecretKey).update(rawBody).digest("hex");
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    }
    catch {
        return false;
    }
};
exports.verifyPaystackWebhookSignature = verifyPaystackWebhookSignature;
const resolveBankAccount = async (accountNumber, bankCode) => {
    const response = await axios_1.default.get(`https://api.paystack.co/bank/resolve`, {
        params: { account_number: accountNumber, bank_code: bankCode },
        headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` },
    });
    return {
        accountName: response.data.data.account_name,
        accountNumber: response.data.data.account_number,
    };
};
exports.resolveBankAccount = resolveBankAccount;
const fetchBanks = async (currency = "NGN") => {
    const response = await axios_1.default.get(`https://api.paystack.co/bank`, {
        params: { currency, perPage: 100 },
        headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` },
    });
    return response.data.data; // [{ name, code, ... }]
};
exports.fetchBanks = fetchBanks;
const createTransferRecipient = async (name, accountNumber, bankCode, currency = "NGN") => {
    const response = await axios_1.default.post(`https://api.paystack.co/transferrecipient`, {
        type: "nuban",
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency,
    }, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.recipient_code;
};
exports.createTransferRecipient = createTransferRecipient;
const initiateTransfer = async (amount, recipientCode, reference, reason) => {
    const response = await axios_1.default.post(`https://api.paystack.co/transfer`, {
        source: "balance",
        amount: Math.round(amount * 100),
        recipient: recipientCode,
        reference,
        reason,
        currency: "NGN",
    }, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data; // { transfer_code, status, ... }
};
exports.initiateTransfer = initiateTransfer;
