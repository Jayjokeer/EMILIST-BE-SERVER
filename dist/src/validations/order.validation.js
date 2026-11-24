"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateDeliveryStatus = exports.validateReason = exports.validateRateMerchant = exports.validateBulkCancel = exports.validateListSales = exports.validateListOrders = void 0;
const joi_1 = __importDefault(require("joi"));
const order_enum_1 = require("../enums/order.enum");
const validateListOrders = (req, res, next) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number().integer().min(1).optional(),
        limit: joi_1.default.number().integer().min(1).max(100).optional(),
        sortBy: joi_1.default.string().valid("latest", "oldest", "total_high_low", "total_low_high").optional(),
        status: joi_1.default.string().valid(...Object.values(order_enum_1.OrderDeliveryStatus)).optional(),
    });
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((d) => d.message) });
        return;
    }
    next();
};
exports.validateListOrders = validateListOrders;
const validateListSales = (req, res, next) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number().integer().min(1).optional(),
        limit: joi_1.default.number().integer().min(1).max(100).optional(),
        sortBy: joi_1.default.string().valid("latest", "oldest", "total_high_low", "total_low_high").optional(),
        status: joi_1.default.string().valid(...Object.values(order_enum_1.OrderDeliveryStatus)).optional(),
        paymentStatus: joi_1.default.string().valid(...Object.values(order_enum_1.OrderPaymentStatus)).optional(),
        search: joi_1.default.string().trim().max(100).optional().allow(""),
    });
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((detail) => detail.message) });
        return;
    }
    next();
};
exports.validateListSales = validateListSales;
const validateBulkCancel = (req, res, next) => {
    const schema = joi_1.default.object({
        orderIds: joi_1.default.array().items(joi_1.default.string().required()).min(1).required(),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((d) => d.message) });
        return;
    }
    next();
};
exports.validateBulkCancel = validateBulkCancel;
const validateRateMerchant = (req, res, next) => {
    const schema = joi_1.default.object({
        productId: joi_1.default.string().required(),
        rating: joi_1.default.number().min(1).max(5).required(),
        comment: joi_1.default.string().optional().allow(""),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((d) => d.message) });
        return;
    }
    next();
};
exports.validateRateMerchant = validateRateMerchant;
const validateReason = (req, res, next) => {
    const schema = joi_1.default.object({
        reason: joi_1.default.string().optional().allow(""),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((d) => d.message) });
        return;
    }
    next();
};
exports.validateReason = validateReason;
const validateUpdateDeliveryStatus = (req, res, next) => {
    const schema = joi_1.default.object({
        status: joi_1.default.string()
            .valid(order_enum_1.OrderDeliveryStatus.outForDelivery, order_enum_1.OrderDeliveryStatus.delivered, order_enum_1.OrderDeliveryStatus.received)
            .required(),
        note: joi_1.default.string().trim().max(500).optional().allow(""),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((detail) => detail.message) });
        return;
    }
    next();
};
exports.validateUpdateDeliveryStatus = validateUpdateDeliveryStatus;
