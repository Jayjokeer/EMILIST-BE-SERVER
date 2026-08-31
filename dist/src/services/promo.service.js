"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductsForSeller = exports.isPromoUsable = exports.incrementPromoUsage = exports.deletePromo = exports.updatePromo = exports.fetchSellerPromos = exports.fetchPromoById = exports.fetchPromosByIds = exports.fetchPromoByCode = exports.fetchPromoByExactCode = exports.createPromo = exports.generatePromoCodeString = void 0;
const discount_model_1 = __importDefault(require("../models/discount.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const error_1 = require("../errors/error");
// Ambiguity-free alphabet (no I/O/0/1) for auto-generated codes
const PROMO_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generatePromoCodeString = (length = 8) => {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += PROMO_CODE_ALPHABET[Math.floor(Math.random() * PROMO_CODE_ALPHABET.length)];
    }
    return code;
};
exports.generatePromoCodeString = generatePromoCodeString;
const createPromo = async (payload) => {
    return await discount_model_1.default.create(payload);
};
exports.createPromo = createPromo;
// Exact lookup regardless of active/expiry state - used for uniqueness checks
const fetchPromoByExactCode = async (code) => {
    return await discount_model_1.default.findOne({ code: code.trim().toUpperCase() });
};
exports.fetchPromoByExactCode = fetchPromoByExactCode;
// Only active, unexpired codes are ever handed to buyers
const fetchPromoByCode = async (code) => {
    return await discount_model_1.default.findOne({
        code: code.trim().toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() },
    });
};
exports.fetchPromoByCode = fetchPromoByCode;
const fetchPromosByIds = async (ids) => {
    return await discount_model_1.default.find({ _id: { $in: ids } });
};
exports.fetchPromosByIds = fetchPromosByIds;
const fetchPromoById = async (promoId) => {
    return await discount_model_1.default.findById(promoId);
};
exports.fetchPromoById = fetchPromoById;
const fetchSellerPromos = async (sellerId) => {
    return await discount_model_1.default.find({ sellerId })
        .populate("productIds", "name price images merchantName status")
        .sort({ createdAt: -1 });
};
exports.fetchSellerPromos = fetchSellerPromos;
const updatePromo = async (promoId, payload) => {
    return await discount_model_1.default.findByIdAndUpdate(promoId, payload, { new: true, runValidators: true });
};
exports.updatePromo = updatePromo;
const deletePromo = async (promoId) => {
    return await discount_model_1.default.findByIdAndDelete(promoId);
};
exports.deletePromo = deletePromo;
const incrementPromoUsage = async (promoId) => {
    return await discount_model_1.default.findByIdAndUpdate(promoId, [
        { $set: { useCount: { $add: ["$useCount", 1] } } },
        { $set: { isActive: { $cond: ["$isSingleUse", false, "$isActive"] } } },
    ], { new: true });
};
exports.incrementPromoUsage = incrementPromoUsage;
// A promo only participates in a breakdown/checkout while active and unexpired
const isPromoUsable = (promo) => Boolean(promo && promo.isActive && new Date(promo.expiryDate).getTime() >= Date.now());
exports.isPromoUsable = isPromoUsable;
// Every productId must exist, be live, and be owned by the seller who owns the code
const validateProductsForSeller = async (productIds, sellerId) => {
    const products = await product_model_1.default.find({ _id: { $in: productIds } }).select("_id userId isDeleted name");
    const foundIds = new Set(products.map((product) => String(product._id)));
    const missing = productIds.filter((id) => !foundIds.has(String(id)));
    if (missing.length)
        throw new error_1.BadRequestError(`Product(s) not found: ${missing.join(", ")}`);
    const notOwned = products.filter((product) => String(product.userId) !== String(sellerId) || product.isDeleted);
    if (notOwned.length)
        throw new error_1.BadRequestError("Promo codes can only be created for your own active products");
    return products;
};
exports.validateProductsForSeller = validateProductsForSeller;
