"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVat = exports.calculatePercentage = exports.generateOTPData = exports.generateShortUUID = void 0;
const uuid_1 = require("uuid");
const otplib_1 = require("otplib");
const config_1 = require("./config");
const transactionService = __importStar(require("../services/transaction.service"));
const secret = config_1.config.otpSecret || "";
const generateShortUUID = () => {
    return (0, uuid_1.v4)().slice(0, 6);
};
exports.generateShortUUID = generateShortUUID;
const AddMinutesToDate = (time, minutes) => {
    return new Date(time.getTime() + minutes * 60000);
};
const generateOTPData = (userId) => {
    const period = 60;
    const digits = 5;
    const options = {
        step: period,
        digits,
        epoch: Date.now(),
    };
    otplib_1.totp.options = options;
    const otp = otplib_1.totp.generate(secret + String(userId));
    let time = new Date();
    const otpCreatedAt = time;
    const minutes = 10;
    const otpExpiryTime = AddMinutesToDate(time, minutes);
    return { otp, otpCreatedAt, otpExpiryTime };
};
exports.generateOTPData = generateOTPData;
const calculatePercentage = (currentValue, targetValue) => {
    if (targetValue === 0) {
        return currentValue > 0 ? 100 : 0;
    }
    const percentage = (currentValue / targetValue) * 100;
    return Math.min(Math.max(percentage, 0), 100);
};
exports.calculatePercentage = calculatePercentage;
const calculateVat = (amount) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield transactionService.getVat();
    const vatRate = data.vat / 100;
    const vatAmount = amount * vatRate;
    return {
        vatAmount,
        totalAmount: parseFloat((amount + vatAmount).toFixed(2))
    };
});
exports.calculateVat = calculateVat;
