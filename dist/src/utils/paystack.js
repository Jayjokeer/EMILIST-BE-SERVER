"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaystackPayment = exports.generatePaystackPaymentLink = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const generatePaystackPaymentLink = (reference, amount, email) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.post('https://api.paystack.co/transaction/initialize', {
        reference,
        amount: amount * 100,
        email: email,
    }, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.authorization_url;
});
exports.generatePaystackPaymentLink = generatePaystackPaymentLink;
const verifyPaystackPayment = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${config_1.config.paystackSecretKey}` } });
    return response.data.data.status === 'success' ? 'success' : 'failed';
});
exports.verifyPaystackPayment = verifyPaystackPayment;
