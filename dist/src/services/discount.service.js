"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDiscountCode = void 0;
const discount_model_1 = __importDefault(require("../models/discount.model"));
const validateDiscountCode = async (code) => {
    const discount = await discount_model_1.default.findOne({ code, isActive: true, expiryDate: { $gte: new Date() } });
    return discount;
};
exports.validateDiscountCode = validateDiscountCode;
