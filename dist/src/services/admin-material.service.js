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
exports.initiateAdminOrderReturn = exports.fetchAdminMaterialOrderDetails = exports.fetchAdminMaterialOrders = exports.delistAdminMaterial = exports.fetchAdminMaterialReviews = exports.fetchAdminMaterialDetails = exports.fetchAdminMaterials = exports.fetchAdminMaterialSummary = exports.materialStockStatus = exports.adminMaterialPagination = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const product_model_1 = __importDefault(require("../models/product.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const admin_action_model_1 = __importDefault(require("../models/admin-action.model"));
const order_enum_1 = require("../enums/order.enum");
const orderService = __importStar(require("./order.service"));
const admin_overview_service_1 = require("./admin-overview.service");
const adminMaterialPagination = (pageValue, limitValue) => {
    const page = Math.max(1, Number(pageValue) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
exports.adminMaterialPagination = adminMaterialPagination;
const assertId = (value, label) => {
    if (!mongoose_1.Types.ObjectId.isValid(value))
        throw new error_1.BadRequestError(`Invalid ${label}`);
};
const materialStockStatus = (product) => {
    if (product.status === "inactive" || product.moderation?.isDelisted)
        return "delisted";
    if (Number(product.availableQuantity) <= 0 || product.status === "sold_out")
        return "out_of_stock";
    const lowStockAt = Math.max(10, Number(product.minimumOrder) || 1);
    if (Number(product.availableQuantity) <= lowStockAt)
        return "low_stock";
    if (product.status === "active")
        return "listed";
    return product.status;
};
exports.materialStockStatus = materialStockStatus;
const materialComparison = async (model, filter, dateField, range) => {
    const [current, previous] = await Promise.all([
        model.countDocuments({ ...filter, [dateField]: { $gte: range.currentStart, $lte: range.currentEnd } }),
        model.countDocuments({ ...filter, [dateField]: { $gte: range.previousStart, $lt: range.previousEnd } }),
    ]);
    return { current, previous, percentageChange: (0, admin_overview_service_1.percentageChange)(current, previous) };
};
const fetchAdminMaterialSummary = async (rangeValue) => {
    const range = (0, admin_overview_service_1.overviewRange)(rangeValue);
    const [activeListings, newOrders, deliveriesInProgress, returnedOrders, cancelledOrders, comparisons] = await Promise.all([
        product_model_1.default.countDocuments({ status: "active", isDeleted: false }),
        order_model_1.default.countDocuments({ createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
        order_model_1.default.countDocuments({ deliveryStatus: order_enum_1.OrderDeliveryStatus.outForDelivery }),
        order_model_1.default.countDocuments({ deliveryStatus: order_enum_1.OrderDeliveryStatus.returned }),
        order_model_1.default.countDocuments({ deliveryStatus: order_enum_1.OrderDeliveryStatus.canceled }),
        Promise.all([
            materialComparison(product_model_1.default, { status: "active", isDeleted: false }, "createdAt", range),
            materialComparison(order_model_1.default, {}, "createdAt", range),
            materialComparison(order_model_1.default, { deliveryStatus: order_enum_1.OrderDeliveryStatus.outForDelivery }, "createdAt", range),
            materialComparison(order_model_1.default, { deliveryStatus: order_enum_1.OrderDeliveryStatus.returned }, "returnedAt", range),
            materialComparison(order_model_1.default, { deliveryStatus: order_enum_1.OrderDeliveryStatus.canceled }, "cancelledAt", range),
        ]),
    ]);
    return {
        range: range.range,
        activeListings, newOrders, deliveriesInProgress, returnedOrders, cancelledOrders,
        changes: {
            activeListings: comparisons[0], newOrders: comparisons[1], deliveriesInProgress: comparisons[2],
            returnedOrders: comparisons[3], cancelledOrders: comparisons[4],
        },
    };
};
exports.fetchAdminMaterialSummary = fetchAdminMaterialSummary;
const productFilter = async (query) => {
    const filter = { isDeleted: false };
    if (query.category && mongoose_1.Types.ObjectId.isValid(String(query.category)))
        filter.category = query.category;
    if (query.merchantId && mongoose_1.Types.ObjectId.isValid(String(query.merchantId)))
        filter.userId = query.merchantId;
    if (query.status) {
        switch (String(query.status)) {
            case "listed":
                filter.status = "active";
                filter.availableQuantity = { $gt: 10 };
                break;
            case "low_stock":
                filter.status = "active";
                filter.availableQuantity = { $gt: 0 };
                filter.$expr = { $lte: ["$availableQuantity", { $max: [10, { $ifNull: ["$minimumOrder", 1] }] }] };
                break;
            case "out_of_stock":
                filter.$or = [{ status: "sold_out" }, { availableQuantity: { $lte: 0 } }];
                break;
            case "delisted":
                filter.$or = [{ status: "inactive" }, { "moderation.isDelisted": true }];
                break;
            default: filter.status = query.status;
        }
    }
    const search = String(query.search || "").trim();
    if (search) {
        const merchants = await users_model_1.default.find({ $or: [
                { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
            ] }).select("_id").lean();
        const searchFilter = { $or: [
                { name: { $regex: search, $options: "i" } }, { brand: { $regex: search, $options: "i" } },
                { merchantName: { $regex: search, $options: "i" } }, { userId: { $in: merchants.map((item) => item._id) } },
                ...(mongoose_1.Types.ObjectId.isValid(search) ? [{ _id: new mongoose_1.Types.ObjectId(search) }] : []),
            ] };
        filter.$and = [...(filter.$and || []), searchFilter];
    }
    return filter;
};
const fetchAdminMaterials = async (query) => {
    const { page, limit, skip } = (0, exports.adminMaterialPagination)(query.page, query.limit);
    const filter = await productFilter(query);
    const [products, total] = await Promise.all([
        product_model_1.default.find(filter).populate("userId", "firstName lastName userName uniqueId email displayImage")
            .populate("category", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        product_model_1.default.countDocuments(filter),
    ]);
    return {
        products: products.map((product) => ({
            id: product._id, listedAt: product.createdAt, name: product.name,
            image: product.images?.find((image) => image.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || null,
            merchant: product.userId, category: product.category, price: product.discountedPrice ?? product.price,
            currency: product.currency, priceMetric: product.priceMetric, stock: product.availableQuantity,
            quantityMetric: product.quantityMetric, quantitySold: product.totalUnitsSold || 0,
            status: (0, exports.materialStockStatus)(product),
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
exports.fetchAdminMaterials = fetchAdminMaterials;
const reviewData = async (productId, merchantId, query = {}) => {
    const { page, limit, skip } = (0, exports.adminMaterialPagination)(query.page || 1, query.limit || 10);
    const reviewFilter = { productId };
    if (query.search)
        reviewFilter.comment = { $regex: String(query.search), $options: "i" };
    const merchantProducts = await product_model_1.default.find({ userId: merchantId, isDeleted: false }).select("_id").lean();
    const [reviews, total, distributionRows, merchantRows] = await Promise.all([
        review_model_1.default.find(reviewFilter).populate("userId", "firstName lastName userName uniqueId displayImage")
            .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        review_model_1.default.countDocuments(reviewFilter),
        review_model_1.default.aggregate([{ $match: { productId } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]),
        review_model_1.default.aggregate([
            { $match: { productId: { $in: merchantProducts.map((item) => item._id) } } },
            { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]),
    ]);
    const distribution = Object.fromEntries(distributionRows.map((row) => [row._id, row.count]));
    const allRatings = distributionRows.reduce((sum, row) => sum + row.count, 0);
    const weighted = distributionRows.reduce((sum, row) => sum + Number(row._id) * row.count, 0);
    return {
        averageRating: allRatings ? Number((weighted / allRatings).toFixed(2)) : 0,
        reviewCount: allRatings,
        ratingDistribution: { 5: distribution[5] || 0, 4: distribution[4] || 0, 3: distribution[3] || 0, 2: distribution[2] || 0, 1: distribution[1] || 0 },
        merchantRating: Number((merchantRows[0]?.average || 0).toFixed(2)),
        merchantReviewCount: merchantRows[0]?.count || 0,
        reviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
const fetchProduct = async (productId) => {
    assertId(productId, "product id");
    const product = await product_model_1.default.findById(productId)
        .populate("userId", "firstName lastName userName uniqueId email displayImage houseAddress city state country")
        .populate("category", "name").lean();
    if (!product)
        throw new error_1.NotFoundError("Material listing not found");
    return product;
};
const fetchAdminMaterialDetails = async (productId, query) => {
    const product = await fetchProduct(productId);
    const ratings = await reviewData(product._id, product.userId?._id || product.userId, query);
    return {
        ...product,
        listingStatus: (0, exports.materialStockStatus)(product),
        stock: { available: product.availableQuantity, metric: product.quantityMetric, sold: product.totalUnitsSold || 0 },
        ratings,
    };
};
exports.fetchAdminMaterialDetails = fetchAdminMaterialDetails;
const fetchAdminMaterialReviews = async (productId, query) => {
    const product = await fetchProduct(productId);
    return reviewData(product._id, product.userId?._id || product.userId, query);
};
exports.fetchAdminMaterialReviews = fetchAdminMaterialReviews;
const delistAdminMaterial = async (productId, adminId, reason) => {
    assertId(productId, "product id");
    const product = await product_model_1.default.findById(productId);
    if (!product)
        throw new error_1.NotFoundError("Material listing not found");
    if (product.status === "inactive" && product.moderation?.isDelisted)
        throw new error_1.BadRequestError("Material is already de-listed");
    const previousState = { status: product.status, moderation: product.moderation };
    product.status = "inactive";
    product.moderation = { isDelisted: true, reason, adminId, delistedAt: new Date() };
    await product.save();
    await admin_action_model_1.default.create({
        adminId, targetUserId: product.userId, targetType: "product", targetId: product._id,
        action: "product.delisted", reason, previousState,
        newState: { status: product.status, moderation: product.moderation },
    });
    return (0, exports.fetchAdminMaterialDetails)(productId, {});
};
exports.delistAdminMaterial = delistAdminMaterial;
const orderFilter = async (query, productId) => {
    const filter = {};
    if (productId) {
        assertId(productId, "product id");
        filter["products.productId"] = productId;
    }
    if (query.deliveryStatus)
        filter.deliveryStatus = query.deliveryStatus;
    if (query.paymentStatus)
        filter.paymentStatus = query.paymentStatus;
    const search = String(query.search || "").trim();
    if (search) {
        const users = await users_model_1.default.find({ $or: [
                { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
            ] }).select("_id").lean();
        filter.$or = [
            { userId: { $in: users.map((item) => item._id) } },
            { "products.merchantId": { $in: users.map((item) => item._id) } },
            { "products.productName": { $regex: search, $options: "i" } },
            { "products.merchantName": { $regex: search, $options: "i" } },
            ...(mongoose_1.Types.ObjectId.isValid(search) ? [{ _id: new mongoose_1.Types.ObjectId(search) }] : []),
        ];
    }
    return filter;
};
const fetchAdminMaterialOrders = async (query, productId) => {
    const { page, limit, skip } = (0, exports.adminMaterialPagination)(query.page, query.limit);
    const filter = await orderFilter(query, productId);
    const [orders, total] = await Promise.all([
        order_model_1.default.find(filter).populate("userId", "firstName lastName userName uniqueId email displayImage houseAddress city state country")
            .populate("products.merchantId", "firstName lastName userName uniqueId email displayImage")
            .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        order_model_1.default.countDocuments(filter),
    ]);
    const rows = orders.flatMap((order) => order.products
        .filter((item) => !productId || String(item.productId) === productId)
        .map((item) => ({
        orderId: order._id, orderDate: order.createdAt, buyer: order.userId,
        productId: item.productId, productName: item.productName, thumbnail: item.thumbnail,
        merchant: item.merchantId || { name: item.merchantName }, quantity: item.quantity,
        quantityMetric: item.quantityMetric, salePrice: item.price * item.quantity,
        unitPrice: item.price, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus,
    })));
    return { orders: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};
exports.fetchAdminMaterialOrders = fetchAdminMaterialOrders;
const fetchAdminMaterialOrderDetails = async (orderId, query) => {
    assertId(orderId, "order id");
    const order = await order_model_1.default.findById(orderId)
        .populate("userId", "firstName lastName userName uniqueId email displayImage houseAddress city state country")
        .populate("products.productId")
        .populate("products.merchantId", "firstName lastName userName uniqueId email displayImage")
        .lean();
    if (!order)
        throw new error_1.NotFoundError("Order not found");
    const selected = query.productId
        ? order.products.find((item) => String(item.productId?._id || item.productId) === String(query.productId))
        : order.products[0];
    if (!selected)
        throw new error_1.NotFoundError("Product is not part of this order");
    const productId = selected.productId?._id || selected.productId;
    const ratings = productId ? await reviewData(productId, selected.merchantId?._id || selected.merchantId, query) : null;
    return { ...order, selectedProduct: selected, ratings, canInitiateReturn: order.deliveryStatus === order_enum_1.OrderDeliveryStatus.delivered };
};
exports.fetchAdminMaterialOrderDetails = fetchAdminMaterialOrderDetails;
const initiateAdminOrderReturn = async (orderId, adminId, reason) => {
    assertId(orderId, "order id");
    const order = await order_model_1.default.findById(orderId);
    if (!order)
        throw new error_1.NotFoundError("Order not found");
    const previousState = { deliveryStatus: order.deliveryStatus, paymentStatus: order.paymentStatus };
    const returned = await orderService.returnOrder(orderId, String(order.userId), reason);
    returned.adminReturn = { initiatedBy: adminId, initiatedAt: new Date(), reason };
    await returned.save();
    await admin_action_model_1.default.create({
        adminId, targetUserId: order.userId, targetType: "order", targetId: order._id,
        action: "order.return_initiated", reason, previousState,
        newState: { deliveryStatus: returned.deliveryStatus, paymentStatus: returned.paymentStatus },
    });
    return (0, exports.fetchAdminMaterialOrderDetails)(orderId, {});
};
exports.initiateAdminOrderReturn = initiateAdminOrderReturn;
