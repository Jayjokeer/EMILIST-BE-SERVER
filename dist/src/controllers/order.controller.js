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
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCancelOrdersController = exports.trackOrderController = exports.rateMerchantController = exports.reorderController = exports.returnOrderController = exports.cancelOrderController = exports.getOrderByIdController = exports.getMyOrdersController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const error_1 = require("../errors/error");
const orderService = __importStar(require("../services/order.service"));
const reviewService = __importStar(require("../services/review.service"));
exports.getMyOrdersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { page, limit, sortBy, status } = req.query;
    const data = await orderService.fetchOrdersForUser(userId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy,
        status: status,
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.getOrderByIdController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const order = await orderService.fetchOrderByIdAndUser(id, userId);
    if (!order)
        throw new error_1.NotFoundError("Order not found");
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, order);
});
exports.cancelOrderController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;
    const order = await orderService.cancelOrder(id, userId, reason);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, order);
});
exports.returnOrderController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;
    const order = await orderService.returnOrder(id, userId, reason);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, order);
});
exports.reorderController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const cart = await orderService.createReorderCart(id, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, cart);
});
exports.rateMerchantController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { productId, rating, comment } = req.body;
    const order = await orderService.fetchOrderByIdAndUser(id, userId);
    if (!order)
        throw new error_1.NotFoundError("Order not found");
    const orderProduct = (order.products || []).find((p) => String(p.productId) === String(productId));
    if (!orderProduct) {
        throw new error_1.BadRequestError("You cannot rate a product you did not purchase in this order");
    }
    const isReviewed = await reviewService.isUserReviewed(productId, userId);
    if (isReviewed) {
        throw new error_1.BadRequestError("You have previously reviewed this product");
    }
    const data = await reviewService.addReview({ productId, userId, rating, comment });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.trackOrderController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const order = await orderService.fetchOrderByIdAndUser(id, userId);
    if (!order)
        throw new error_1.NotFoundError("Order not found");
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        deliveryStatus: order.deliveryStatus,
        deliveryDate: order.deliveryDate,
        deliveredAt: order.deliveredAt,
        timeline: order.deliverySteps || [],
    });
});
exports.bulkCancelOrdersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new error_1.BadRequestError("orderIds must be a non-empty array");
    }
    const results = [];
    for (const orderId of orderIds) {
        try {
            await orderService.cancelOrder(orderId, userId);
            results.push({ orderId, success: true, message: "Order cancelled" });
        }
        catch (error) {
            results.push({
                orderId,
                success: false,
                message: error?.message || "Order could not be cancelled",
            });
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, results);
});
