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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReorderCart = exports.returnOrder = exports.cancelOrder = exports.pushDeliveryStep = exports.fetchOrdersForUser = exports.fetchOrderByIdAndUser = exports.fetchOrderByOrderId = exports.fetchOrderByCartIdForUser = exports.fetchOrderByCartId = exports.createOrder = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const order_enum_1 = require("../enums/order.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const walletService = __importStar(require("./wallet.services"));
const transactionService = __importStar(require("./transaction.service"));
const productService = __importStar(require("./product.service"));
const cartService = __importStar(require("./cart.service"));
const error_1 = require("../errors/error");
const createOrder = async (payload) => {
    return await order_model_1.default.create(payload);
};
exports.createOrder = createOrder;
const fetchOrderByCartId = async (cartId) => {
    return await order_model_1.default.findOne({ cartId });
};
exports.fetchOrderByCartId = fetchOrderByCartId;
const fetchOrderByCartIdForUser = async (cartId, userId) => {
    return await order_model_1.default.findOne({ cartId, userId });
};
exports.fetchOrderByCartIdForUser = fetchOrderByCartIdForUser;
const fetchOrderByOrderId = async (orderId) => {
    return await order_model_1.default.findById(orderId);
};
exports.fetchOrderByOrderId = fetchOrderByOrderId;
const fetchOrderByIdAndUser = async (orderId, userId) => {
    return await order_model_1.default.findOne({ _id: orderId, userId });
};
exports.fetchOrderByIdAndUser = fetchOrderByIdAndUser;
// Real server-side pagination — never fetch-all-then-slice.
const fetchOrdersForUser = async (userId, { page = 1, limit = 10, sortBy = "latest", status, }) => {
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(limit) || 10, 1);
    const skip = (currentPage - 1) * pageSize;
    const query = { userId };
    if (status && Object.values(order_enum_1.OrderDeliveryStatus).includes(status)) {
        query.deliveryStatus = status;
    }
    const sortMap = {
        latest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        total_high_low: { totalAmount: -1 },
        total_low_high: { totalAmount: 1 },
    };
    const [orders, total] = await Promise.all([
        order_model_1.default.find(query)
            .sort(sortMap[sortBy] || sortMap.latest)
            .skip(skip)
            .limit(pageSize),
        order_model_1.default.countDocuments(query),
    ]);
    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
        orders,
        pagination: {
            total,
            currentPage,
            totalPages,
            hasNext: currentPage < totalPages,
            hasPrevious: currentPage > 1,
        },
    };
};
exports.fetchOrdersForUser = fetchOrdersForUser;
const pushDeliveryStep = async (orderId, status, note) => {
    return await order_model_1.default.findByIdAndUpdate(orderId, {
        $set: { deliveryStatus: status },
        $push: { deliverySteps: { status, timestamp: new Date(), note: note || undefined } },
    }, { new: true });
};
exports.pushDeliveryStep = pushDeliveryStep;
const restoreOrderStock = async (order) => {
    for (const item of order.products || []) {
        const product = await productService.fetchProductById(item.productId);
        if (product) {
            product.availableQuantity += item.quantity;
            product.totalUnitsSold = Math.max(0, (product.totalUnitsSold || 0) - item.quantity);
            await product.save();
        }
    }
};
// Refund a paid order to the user's NGN wallet via the existing wallet/transaction services.
const refundPaidOrder = async (order) => {
    if (order.paymentStatus !== order_enum_1.OrderPaymentStatus.paid)
        return;
    const wallet = await walletService.findUserWalletByCurrency(String(order.userId), transaction_enum_1.WalletEnum.NGN);
    if (!wallet)
        throw new error_1.BadRequestError("No NGN wallet found to process refund");
    wallet.balance += order.totalAmount;
    await wallet.save();
    await transactionService.createTransaction({
        userId: order.userId,
        type: transaction_enum_1.TransactionType.CREDIT,
        amount: order.totalAmount,
        description: `Refund for order ${order._id}`,
        paymentMethod: "Wallet",
        balanceBefore: wallet.balance - order.totalAmount,
        balanceAfter: wallet.balance,
        walletId: wallet._id,
        currency: wallet.currency,
        status: transaction_enum_1.TransactionEnum.completed,
        orderId: order._id,
    });
};
const cancelOrder = async (orderId, userId, reason) => {
    const order = await (0, exports.fetchOrderByIdAndUser)(orderId, userId);
    if (!order)
        throw new error_1.BadRequestError("Order not found");
    if (order.deliveryStatus !== order_enum_1.OrderDeliveryStatus.orderConfirmed) {
        throw new error_1.BadRequestError(`Order cannot be cancelled from "${order.deliveryStatus}" status`);
    }
    await restoreOrderStock(order);
    await refundPaidOrder(order);
    const updated = await order_model_1.default.findByIdAndUpdate(orderId, {
        $set: {
            status: order_enum_1.OrderStatus.canceled,
            deliveryStatus: order_enum_1.OrderDeliveryStatus.canceled,
            cancelReason: reason || undefined,
            cancelledAt: new Date(),
        },
        $push: {
            deliverySteps: {
                status: order_enum_1.OrderDeliveryStatus.canceled,
                timestamp: new Date(),
                note: reason || "Order cancelled",
            },
        },
    }, { new: true });
    return updated;
};
exports.cancelOrder = cancelOrder;
const returnOrder = async (orderId, userId, reason) => {
    const order = await (0, exports.fetchOrderByIdAndUser)(orderId, userId);
    if (!order)
        throw new error_1.BadRequestError("Order not found");
    if (order.deliveryStatus !== order_enum_1.OrderDeliveryStatus.delivered) {
        throw new error_1.BadRequestError("Order can only be returned after delivery");
    }
    // 7-day return window from delivery
    if (order.deliveredAt) {
        const windowEnd = new Date(order.deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (new Date() > windowEnd) {
            throw new error_1.BadRequestError("Return window of 7 days has expired");
        }
    }
    await restoreOrderStock(order);
    await refundPaidOrder(order);
    const updated = await order_model_1.default.findByIdAndUpdate(orderId, {
        $set: {
            deliveryStatus: order_enum_1.OrderDeliveryStatus.returned,
            returnReason: reason || undefined,
            returnedAt: new Date(),
        },
        $push: {
            deliverySteps: {
                status: order_enum_1.OrderDeliveryStatus.returned,
                timestamp: new Date(),
                note: reason || "Order returned",
            },
        },
    }, { new: true });
    return updated;
};
exports.returnOrder = returnOrder;
// Re-create a fresh active cart from a delivered order's items.
// Re-checks current stock/price at reorder time (never assumes original availability).
const createReorderCart = async (orderId, userId) => {
    const order = await (0, exports.fetchOrderByIdAndUser)(orderId, userId);
    if (!order)
        throw new error_1.BadRequestError("Order not found");
    if (order.deliveryStatus !== order_enum_1.OrderDeliveryStatus.delivered) {
        throw new error_1.BadRequestError("Reorder is only available for delivered orders");
    }
    const products = [];
    let totalAmount = 0;
    for (const item of order.products || []) {
        const product = await productService.fetchProductById(item.productId);
        if (!product)
            throw new error_1.BadRequestError("A product in this order no longer exists");
        const currentPrice = product.isDiscounted && product.discountedPrice != null
            ? product.discountedPrice
            : product.price;
        if (Number(product.availableQuantity) < item.quantity) {
            throw new error_1.BadRequestError(`Insufficient stock for ${product.name || "a product"} — only ${product.availableQuantity} available`);
        }
        products.push({ productId: product._id, quantity: item.quantity, price: currentPrice });
        totalAmount += currentPrice * item.quantity;
    }
    const cart = await cartService.createCart({
        userId,
        products,
        totalAmount,
        status: "active",
        isPaid: false,
    });
    return cart;
};
exports.createReorderCart = createReorderCart;
