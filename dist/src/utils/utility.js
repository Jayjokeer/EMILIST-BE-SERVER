"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePercentage = exports.generateOTPData = exports.generateShortUUID = void 0;
const uuid_1 = require("uuid");
const otplib_1 = require("otplib");
const config_1 = require("./config");
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
