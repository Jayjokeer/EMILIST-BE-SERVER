"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiscount = exports.fetchDiscountCode = exports.deleteCart = exports.fetchCartByIdPayment = exports.fetchCartById = exports.fetchCartByUserId = exports.fetchCartByUser = exports.createCart = void 0;
const cart_enum_1 = require("../enums/cart.enum");
const cart_model_1 = __importDefault(require("../models/cart.model"));
const discount_model_1 = __importDefault(require("../models/discount.model"));
const createCart = async (payload) => {
    return await cart_model_1.default.create(payload);
};
exports.createCart = createCart;
const fetchCartByUser = async (userId) => {
    return await cart_model_1.default.findOne({ userId, status: cart_enum_1.CartStatus.active }).populate("products.productId");
};
exports.fetchCartByUser = fetchCartByUser;
const fetchCartByUserId = async (userId) => {
    return await cart_model_1.default.findOne({ userId }).populate("products.productId");
};
exports.fetchCartByUserId = fetchCartByUserId;
const fetchCartById = async (cartId) => {
    return await cart_model_1.default.findById(cartId);
};
exports.fetchCartById = fetchCartById;
const fetchCartByIdPayment = async (cartId, userId) => {
    return await cart_model_1.default.findById({ _id: cartId, userId }).populate("products.productId");
};
exports.fetchCartByIdPayment = fetchCartByIdPayment;
const deleteCart = async (cartId) => {
    return await cart_model_1.default.findByIdAndDelete(cartId);
};
exports.deleteCart = deleteCart;
const fetchDiscountCode = async (discountId) => {
    return await discount_model_1.default.findOne({
        code: discountId,
        isActive: true,
        expiryDate: { $gte: new Date() },
    });
};
exports.fetchDiscountCode = fetchDiscountCode;
const createDiscount = async (payload) => {
    return await discount_model_1.default.create(payload);
};
exports.createDiscount = createDiscount;
