"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaystackPayment = exports.generatePaystackPaymentLink = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const generatePaystackPaymentLink = async (reference, amount, email) => {
    const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
        reference,
        amount: amount * 100,
        email: email,
    }, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.authorization_url;
};
exports.generatePaystackPaymentLink = generatePaystackPaymentLink;
const verifyPaystackPayment = async (reference) => {
    const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.status === 'success' ? 'success' : 'failed';
};
exports.verifyPaystackPayment = verifyPaystackPayment;
