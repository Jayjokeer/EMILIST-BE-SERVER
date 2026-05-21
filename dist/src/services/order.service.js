"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrderByOrderId = exports.fetchOrderByCartId = exports.createOrder = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const createOrder = async (payload) => {
    return await order_model_1.default.create(payload);
};
exports.createOrder = createOrder;
const fetchOrderByCartId = async (cartId) => {
    return await order_model_1.default.findOne({ cartId });
};
exports.fetchOrderByCartId = fetchOrderByCartId;
const fetchOrderByOrderId = async (orderId) => {
    return await order_model_1.default.findById(orderId);
};
exports.fetchOrderByOrderId = fetchOrderByOrderId;
