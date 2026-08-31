import { CartStatus } from "../enums/cart.enum"
import { ICart } from "../interfaces/cart.interface"
import Cart from "../models/cart.model"
import Discount from "../models/discount.model"

export const createCart = async(payload: any) =>{
    return await Cart.create(payload);
};

export const fetchCartByUser = async (userId: string)=>{
    return await Cart.findOne({userId, status: CartStatus.active}).populate("products.productId");
};
export const fetchCartByUserId = async (userId: string)=>{
    return await Cart.findOne({userId}).populate("products.productId");
};
export const fetchCartById = async (cartId: string)=>{
    return await Cart.findById(cartId);
};
export const fetchCartByIdPayment = async (cartId: string, userId: string)=>{
    return await Cart.findOne({ _id: cartId, userId }).populate("products.productId");
};
export const deleteCart = async (cartId: string) =>{
    return await Cart.findByIdAndDelete(cartId);
};

// === Applied promo codes ===
// Codes live on the cart as {discountId, code} references and are resolved
// against the Discount collection wherever the breakdown is computed.
export const addAppliedPromo = async (cart: any, promo: any) => {
    cart.appliedPromoCodes = cart.appliedPromoCodes || [];
    const alreadyApplied = cart.appliedPromoCodes.some((entry: any) => String(entry.discountId) === String(promo._id));
    if (alreadyApplied) return cart;
    cart.appliedPromoCodes.push({ discountId: promo._id, code: promo.code });
    return await cart.save();
};

export const removeAppliedPromo = async (cart: any, code: string) => {
    const normalized = code.trim().toUpperCase();
    cart.appliedPromoCodes = (cart.appliedPromoCodes || []).filter((entry: any) => entry.code !== normalized);
    return await cart.save();
};

// Drop applied codes that are no longer usable: the promo doc is gone, inactive
// or expired, or none of its scoped products are in the cart anymore.
export const pruneAppliedPromos = async (cart: any) => {
    const applied = cart.appliedPromoCodes || [];
    if (!applied.length) return cart;
    const promos = await Discount.find({ _id: { $in: applied.map((entry: any) => entry.discountId) } });
    const cartProductIds = new Set((cart.products || []).map((item: any) => String(item.productId?._id || item.productId)));
    const keep = applied.filter((entry: any) => {
        const promo: any = promos.find((p: any) => String(p._id) === String(entry.discountId));
        if (!promo) return false;
        const notExpired = new Date(promo.expiryDate).getTime() >= Date.now();
        return Boolean(promo.isActive && notExpired && (promo.productIds || []).some((id: any) => cartProductIds.has(String(id))));
    });
    if (keep.length === applied.length) return cart;
    cart.appliedPromoCodes = keep;
    return await cart.save();
};
