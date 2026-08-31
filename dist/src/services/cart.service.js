"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pruneAppliedPromos = exports.removeAppliedPromo = exports.addAppliedPromo = exports.deleteCart = exports.fetchCartByIdPayment = exports.fetchCartById = exports.fetchCartByUserId = exports.fetchCartByUser = exports.createCart = void 0;
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
    return await cart_model_1.default.findOne({ _id: cartId, userId }).populate("products.productId");
};
exports.fetchCartByIdPayment = fetchCartByIdPayment;
const deleteCart = async (cartId) => {
    return await cart_model_1.default.findByIdAndDelete(cartId);
};
exports.deleteCart = deleteCart;
// === Applied promo codes ===
// Codes live on the cart as {discountId, code} references and are resolved
// against the Discount collection wherever the breakdown is computed.
const addAppliedPromo = async (cart, promo) => {
    cart.appliedPromoCodes = cart.appliedPromoCodes || [];
    const alreadyApplied = cart.appliedPromoCodes.some((entry) => String(entry.discountId) === String(promo._id));
    if (alreadyApplied)
        return cart;
    cart.appliedPromoCodes.push({ discountId: promo._id, code: promo.code });
    return await cart.save();
};
exports.addAppliedPromo = addAppliedPromo;
const removeAppliedPromo = async (cart, code) => {
    const normalized = code.trim().toUpperCase();
    cart.appliedPromoCodes = (cart.appliedPromoCodes || []).filter((entry) => entry.code !== normalized);
    return await cart.save();
};
exports.removeAppliedPromo = removeAppliedPromo;
// Drop applied codes that are no longer usable: the promo doc is gone, inactive
// or expired, or none of its scoped products are in the cart anymore.
const pruneAppliedPromos = async (cart) => {
    const applied = cart.appliedPromoCodes || [];
    if (!applied.length)
        return cart;
    const promos = await discount_model_1.default.find({ _id: { $in: applied.map((entry) => entry.discountId) } });
    const cartProductIds = new Set((cart.products || []).map((item) => String(item.productId?._id || item.productId)));
    const keep = applied.filter((entry) => {
        const promo = promos.find((p) => String(p._id) === String(entry.discountId));
        if (!promo)
            return false;
        const notExpired = new Date(promo.expiryDate).getTime() >= Date.now();
        return Boolean(promo.isActive && notExpired && (promo.productIds || []).some((id) => cartProductIds.has(String(id))));
    });
    if (keep.length === applied.length)
        return cart;
    cart.appliedPromoCodes = keep;
    return await cart.save();
};
exports.pruneAppliedPromos = pruneAppliedPromos;
