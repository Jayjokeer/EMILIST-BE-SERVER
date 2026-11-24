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
exports.createReorderCart = exports.returnOrder = exports.cancelOrder = exports.updateOrderDeliveryStatus = exports.pushDeliveryStep = exports.fetchSalesForSeller = exports.fetchOrdersForUser = exports.orderDetailsForParticipant = exports.fetchOrderByIdForParticipant = exports.fetchOrderByIdAndUser = exports.fetchOrderByOrderId = exports.fetchOrderByCartIdForUser = exports.fetchOrderByCartId = exports.createOrder = exports.availableOrderActions = exports.currentDeliveryStatusUpdatedAt = exports.buildOrderSteps = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const order_enum_1 = require("../enums/order.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const walletService = __importStar(require("./wallet.services"));
const transactionService = __importStar(require("./transaction.service"));
const productService = __importStar(require("./product.service"));
const cartService = __importStar(require("./cart.service"));
const error_1 = require("../errors/error");
const mongoose_1 = require("mongoose");
const orderStepDefinitions = [
    { status: order_enum_1.OrderDeliveryStatus.orderConfirmed, label: "Order confirmed", responsibleParty: "system" },
    { status: order_enum_1.OrderDeliveryStatus.outForDelivery, label: "Out for delivery", responsibleParty: "seller" },
    { status: order_enum_1.OrderDeliveryStatus.delivered, label: "Delivered", responsibleParty: "buyer" },
    { status: order_enum_1.OrderDeliveryStatus.received, label: "Received", responsibleParty: "buyer" },
];
const statusRank = {
    [order_enum_1.OrderDeliveryStatus.orderConfirmed]: 0,
    [order_enum_1.OrderDeliveryStatus.outForDelivery]: 1,
    [order_enum_1.OrderDeliveryStatus.delivered]: 2,
    [order_enum_1.OrderDeliveryStatus.received]: 3,
};
const dateValue = (value) => {
    if (!value)
        return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};
const buildOrderSteps = (order) => {
    const savedSteps = [...(order.deliverySteps || [])].sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
    const currentRank = statusRank[order.deliveryStatus];
    const standardSteps = orderStepDefinitions.map((definition, index) => {
        const saved = savedSteps.find((step) => step.status === definition.status);
        const activatedAt = dateValue(saved?.timestamp)
            || (definition.status === order_enum_1.OrderDeliveryStatus.orderConfirmed ? dateValue(order.createdAt) : undefined)
            || (definition.status === order_enum_1.OrderDeliveryStatus.delivered ? dateValue(order.deliveredAt) : undefined)
            || (definition.status === order_enum_1.OrderDeliveryStatus.received ? dateValue(order.receivedAt) : undefined);
        const reached = Boolean(activatedAt) || (currentRank !== undefined && currentRank >= index);
        return {
            status: definition.status,
            label: definition.label,
            responsibleParty: definition.responsibleParty,
            isCompleted: reached,
            isCurrent: order.deliveryStatus === definition.status,
            ...(activatedAt ? { activatedAt } : {}),
            ...(saved?.note ? { note: saved.note } : {}),
            ...(saved?.actorType ? { updatedBy: saved.actorType } : {}),
            ...(saved?.actorId ? { updatedByUserId: saved.actorId } : {}),
            ...(saved?.imageUrl ? { imageUrl: saved.imageUrl } : {}),
        };
    });
    const exceptionalSteps = [
        { status: order_enum_1.OrderDeliveryStatus.canceled, label: "Order cancelled", date: order.cancelledAt },
        { status: order_enum_1.OrderDeliveryStatus.returned, label: "Order returned", date: order.returnedAt },
    ].flatMap((definition) => {
        const saved = savedSteps.find((step) => step.status === definition.status);
        const activatedAt = dateValue(saved?.timestamp) || dateValue(definition.date);
        if (!activatedAt && order.deliveryStatus !== definition.status)
            return [];
        return [{
                status: definition.status,
                label: definition.label,
                responsibleParty: "buyer",
                isCompleted: true,
                isCurrent: order.deliveryStatus === definition.status,
                ...(activatedAt ? { activatedAt } : {}),
                ...(saved?.note ? { note: saved.note } : {}),
                ...(saved?.actorType ? { updatedBy: saved.actorType } : {}),
                ...(saved?.actorId ? { updatedByUserId: saved.actorId } : {}),
                ...(saved?.imageUrl ? { imageUrl: saved.imageUrl } : {}),
            }];
    });
    return [...standardSteps, ...exceptionalSteps];
};
exports.buildOrderSteps = buildOrderSteps;
const currentDeliveryStatusUpdatedAt = (order) => {
    const matchingSteps = (order.deliverySteps || [])
        .filter((step) => step.status === order.deliveryStatus)
        .map((step) => dateValue(step.timestamp))
        .filter(Boolean);
    if (matchingSteps.length) {
        return matchingSteps.sort((left, right) => right.getTime() - left.getTime())[0];
    }
    const fallbackByStatus = {
        [order_enum_1.OrderDeliveryStatus.orderConfirmed]: order.createdAt,
        [order_enum_1.OrderDeliveryStatus.delivered]: order.deliveredAt,
        [order_enum_1.OrderDeliveryStatus.received]: order.receivedAt,
        [order_enum_1.OrderDeliveryStatus.canceled]: order.cancelledAt,
        [order_enum_1.OrderDeliveryStatus.returned]: order.returnedAt,
    };
    return dateValue(fallbackByStatus[order.deliveryStatus]) || null;
};
exports.currentDeliveryStatusUpdatedAt = currentDeliveryStatusUpdatedAt;
const participantRole = (order, userId) => {
    if (String(order.userId) === String(userId))
        return "buyer";
    const isSeller = (order.products || []).some((product) => String(product.merchantId) === String(userId));
    return isSeller ? "seller" : null;
};
const availableOrderActions = (order, userId) => {
    const role = participantRole(order, userId);
    if (role === "seller" && order.paymentStatus === order_enum_1.OrderPaymentStatus.paid && order.deliveryStatus === order_enum_1.OrderDeliveryStatus.orderConfirmed) {
        return [order_enum_1.OrderDeliveryStatus.outForDelivery];
    }
    if (role === "buyer" && order.deliveryStatus === order_enum_1.OrderDeliveryStatus.outForDelivery) {
        return [order_enum_1.OrderDeliveryStatus.delivered];
    }
    if (role === "buyer" && order.deliveryStatus === order_enum_1.OrderDeliveryStatus.delivered) {
        return [order_enum_1.OrderDeliveryStatus.received];
    }
    return [];
};
exports.availableOrderActions = availableOrderActions;
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
const fetchOrderByIdForParticipant = async (orderId, userId) => {
    return await order_model_1.default.findOne({
        _id: orderId,
        $or: [{ userId }, { products: { $elemMatch: { merchantId: userId } } }],
    });
};
exports.fetchOrderByIdForParticipant = fetchOrderByIdForParticipant;
const orderDetailsForParticipant = (order, userId) => {
    const value = typeof order.toObject === "function" ? order.toObject() : { ...order };
    const viewerRole = participantRole(value, userId);
    return {
        ...value,
        deliveryStatusUpdatedAt: (0, exports.currentDeliveryStatusUpdatedAt)(value),
        viewerRole,
        allowedDeliveryStatusUpdates: (0, exports.availableOrderActions)(value, userId),
        orderSteps: (0, exports.buildOrderSteps)(value),
    };
};
exports.orderDetailsForParticipant = orderDetailsForParticipant;
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
        orders: orders.map((order) => {
            const value = typeof order.toObject === "function" ? order.toObject() : { ...order };
            return { ...value, deliveryStatusUpdatedAt: (0, exports.currentDeliveryStatusUpdatedAt)(value) };
        }),
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
const fetchSalesForSeller = async (sellerId, { page = 1, limit = 10, sortBy = "latest", status, paymentStatus, search, }) => {
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const sellerObjectId = new mongoose_1.Types.ObjectId(sellerId);
    const lineMatch = { "products.merchantId": sellerObjectId };
    if (status)
        lineMatch.deliveryStatus = status;
    if (paymentStatus)
        lineMatch.paymentStatus = paymentStatus;
    const sortMap = {
        latest: { createdAt: -1, _id: -1 },
        oldest: { createdAt: 1, _id: 1 },
        total_high_low: { saleTotal: -1, createdAt: -1 },
        total_low_high: { saleTotal: 1, createdAt: -1 },
    };
    const normalizedSearch = String(search || "").trim();
    const searchMatch = normalizedSearch
        ? [
            { "products.productName": { $regex: normalizedSearch, $options: "i" } },
            { "products.brand": { $regex: normalizedSearch, $options: "i" } },
            { "products.categoryName": { $regex: normalizedSearch, $options: "i" } },
            { "buyer.email": { $regex: normalizedSearch, $options: "i" } },
            { "buyer.firstName": { $regex: normalizedSearch, $options: "i" } },
            { "buyer.lastName": { $regex: normalizedSearch, $options: "i" } },
            { "buyer.userName": { $regex: normalizedSearch, $options: "i" } },
        ]
        : [];
    if (normalizedSearch && mongoose_1.Types.ObjectId.isValid(normalizedSearch)) {
        searchMatch.push({ _id: new mongoose_1.Types.ObjectId(normalizedSearch) });
    }
    const pipeline = [
        { $match: { "products.merchantId": sellerObjectId } },
        { $unwind: "$products" },
        { $match: lineMatch },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "buyer",
            },
        },
        { $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true } },
        ...(searchMatch.length ? [{ $match: { $or: searchMatch } }] : []),
        {
            $addFields: {
                lineSubtotal: { $multiply: ["$products.quantity", "$products.price"] },
                saleTotal: {
                    $add: [
                        { $subtract: [{ $multiply: ["$products.quantity", "$products.price"] }, { $ifNull: ["$products.discountAmount", 0] }] },
                        { $ifNull: ["$products.taxAmount", 0] },
                    ],
                },
            },
        },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                rows: [
                    { $sort: sortMap[sortBy] || sortMap.latest },
                    { $skip: (currentPage - 1) * pageSize },
                    { $limit: pageSize },
                ],
            },
        },
    ];
    const [result] = await order_model_1.default.aggregate(pipeline);
    const total = Number(result?.metadata?.[0]?.total || 0);
    const sales = (result?.rows || []).map((row) => {
        const buyerName = [row.buyer?.firstName, row.buyer?.lastName].filter(Boolean).join(" ")
            || row.buyer?.fullName
            || row.buyer?.userName
            || "Buyer";
        const orderForActions = { ...row, products: [row.products] };
        const steps = (0, exports.buildOrderSteps)(orderForActions);
        const activeStep = [...steps].reverse().find((step) => step.isCompleted);
        const lineSubtotal = Number(row.lineSubtotal || 0);
        const discountAmount = Number(row.products?.discountAmount || 0);
        const taxAmount = Number(row.products?.taxAmount || 0);
        return {
            saleId: String(row.products?._id || `${row._id}:${row.products?.productId}`),
            orderId: row._id,
            orderNumber: String(row._id),
            orderDate: row.createdAt,
            quantity: Number(row.products?.quantity || 0),
            quantityMetric: row.products?.quantityMetric || "unit",
            paymentStatus: row.paymentStatus,
            deliveryStatus: row.deliveryStatus,
            deliveryStatusUpdatedAt: (0, exports.currentDeliveryStatusUpdatedAt)(row),
            deliveryDate: row.deliveryDate || null,
            deliveredAt: row.deliveredAt || null,
            deliveryImage: row.deliveryImage || null,
            receivedAt: row.receivedAt || null,
            deliveryAddress: row.shippingAddress || null,
            product: {
                id: row.products?.productId,
                name: row.products?.productName,
                brand: row.products?.brand,
                category: row.products?.categoryName,
                thumbnail: row.products?.thumbnail,
                unitPrice: Number(row.products?.price || 0),
            },
            pricing: {
                currency: row.products?.currency || "NGN",
                subtotalAmount: lineSubtotal,
                discountAmount,
                taxAmount,
                totalAmount: Number(row.saleTotal || lineSubtotal - discountAmount + taxAmount),
            },
            buyer: {
                id: row.buyer?._id || row.userId,
                name: buyerName,
                email: row.buyer?.email || null,
                phone: row.buyer?.mobile || null,
                image: row.buyer?.displayImage || null,
            },
            latestStep: activeStep || null,
            orderSteps: steps,
            allowedDeliveryStatusUpdates: (0, exports.availableOrderActions)(orderForActions, sellerId),
        };
    });
    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
        sales,
        pagination: {
            total,
            currentPage,
            pageSize,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
        filters: {
            sortBy: sortBy in sortMap ? sortBy : "latest",
            status: status || null,
            paymentStatus: paymentStatus || null,
            search: normalizedSearch || null,
        },
    };
};
exports.fetchSalesForSeller = fetchSalesForSeller;
const pushDeliveryStep = async (orderId, status, note, actorType, actorId) => {
    return await order_model_1.default.findByIdAndUpdate(orderId, {
        $set: { deliveryStatus: status },
        $push: { deliverySteps: { status, timestamp: new Date(), note: note || undefined, actorType, actorId } },
    }, { new: true });
};
exports.pushDeliveryStep = pushDeliveryStep;
const updateOrderDeliveryStatus = async (orderId, userId, nextStatus, note, deliveryImage) => {
    const order = await (0, exports.fetchOrderByIdForParticipant)(orderId, userId);
    if (!order)
        throw new error_1.BadRequestError("Order not found");
    const role = participantRole(order, userId);
    const allowed = (0, exports.availableOrderActions)(order, userId);
    if (!role || !allowed.includes(nextStatus)) {
        if (nextStatus === order_enum_1.OrderDeliveryStatus.outForDelivery && role !== "seller") {
            throw new error_1.ForbiddenError("Only a seller on this order can mark it as out for delivery");
        }
        if (nextStatus === order_enum_1.OrderDeliveryStatus.delivered && role !== "buyer") {
            throw new error_1.ForbiddenError("Only the buyer can confirm that this order was delivered");
        }
        if (nextStatus === order_enum_1.OrderDeliveryStatus.received && role !== "buyer") {
            throw new error_1.ForbiddenError("Only the buyer can confirm that this order was received");
        }
        if (nextStatus === order_enum_1.OrderDeliveryStatus.outForDelivery && order.paymentStatus !== order_enum_1.OrderPaymentStatus.paid) {
            throw new error_1.BadRequestError("An order must be paid before it can be sent for delivery");
        }
        throw new error_1.BadRequestError(`Order cannot move from "${order.deliveryStatus}" to "${nextStatus}"`);
    }
    const now = new Date();
    if (nextStatus === order_enum_1.OrderDeliveryStatus.delivered && !deliveryImage) {
        throw new error_1.BadRequestError("A delivery image is required when marking an order as delivered");
    }
    const expectedStatus = nextStatus === order_enum_1.OrderDeliveryStatus.outForDelivery
        ? order_enum_1.OrderDeliveryStatus.orderConfirmed
        : nextStatus === order_enum_1.OrderDeliveryStatus.delivered
            ? order_enum_1.OrderDeliveryStatus.outForDelivery
            : order_enum_1.OrderDeliveryStatus.delivered;
    const update = {
        $set: {
            deliveryStatus: nextStatus,
            ...(nextStatus === order_enum_1.OrderDeliveryStatus.delivered && {
                deliveredAt: now,
                deliveryImage,
                status: order_enum_1.OrderStatus.completed,
            }),
            ...(nextStatus === order_enum_1.OrderDeliveryStatus.received && { receivedAt: now }),
        },
        $push: {
            deliverySteps: {
                status: nextStatus,
                timestamp: now,
                note: note || undefined,
                actorType: role,
                actorId: userId,
                ...(nextStatus === order_enum_1.OrderDeliveryStatus.delivered && { imageUrl: deliveryImage }),
            },
        },
    };
    const updated = await order_model_1.default.findOneAndUpdate({ _id: orderId, deliveryStatus: expectedStatus }, update, { new: true });
    if (!updated)
        throw new error_1.BadRequestError("The order status changed. Refresh the order and try again");
    return (0, exports.orderDetailsForParticipant)(updated, userId);
};
exports.updateOrderDeliveryStatus = updateOrderDeliveryStatus;
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
                actorType: "buyer",
                actorId: userId,
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
    if (![order_enum_1.OrderDeliveryStatus.delivered, order_enum_1.OrderDeliveryStatus.received].includes(order.deliveryStatus)) {
        throw new error_1.BadRequestError("Order can only be returned after delivery or receipt confirmation");
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
                actorType: "buyer",
                actorId: userId,
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
    if (![order_enum_1.OrderDeliveryStatus.delivered, order_enum_1.OrderDeliveryStatus.received].includes(order.deliveryStatus)) {
        throw new error_1.BadRequestError("Reorder is only available for delivered or received orders");
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
