import Discount from "../models/discount.model";
import Product from "../models/product.model";
import { BadRequestError } from "../errors/error";

// Ambiguity-free alphabet (no I/O/0/1) for auto-generated codes
const PROMO_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generatePromoCodeString = (length = 8): string => {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += PROMO_CODE_ALPHABET[Math.floor(Math.random() * PROMO_CODE_ALPHABET.length)];
    }
    return code;
};

export const createPromo = async (payload: any) => {
    return await Discount.create(payload);
};

// Exact lookup regardless of active/expiry state - used for uniqueness checks
export const fetchPromoByExactCode = async (code: string) => {
    return await Discount.findOne({ code: code.trim().toUpperCase() });
};

// Only active, unexpired codes are ever handed to buyers
export const fetchPromoByCode = async (code: string) => {
    return await Discount.findOne({
        code: code.trim().toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() },
    });
};

export const fetchPromosByIds = async (ids: string[]) => {
    return await Discount.find({ _id: { $in: ids } });
};

export const fetchPromoById = async (promoId: string) => {
    return await Discount.findById(promoId);
};

export const fetchSellerPromos = async (sellerId: string) => {
    return await Discount.find({ sellerId })
        .populate("productIds", "name price images merchantName status")
        .sort({ createdAt: -1 });
};

export const updatePromo = async (promoId: string, payload: any) => {
    return await Discount.findByIdAndUpdate(promoId, payload, { new: true, runValidators: true });
};

export const deletePromo = async (promoId: string) => {
    return await Discount.findByIdAndDelete(promoId);
};

export const incrementPromoUsage = async (promoId: string) => {
    return await Discount.findByIdAndUpdate(
        promoId,
        [
            { $set: { useCount: { $add: ["$useCount", 1] } } },
            { $set: { isActive: { $cond: ["$isSingleUse", false, "$isActive"] } } },
        ],
        { new: true }
    );
};

// A promo only participates in a breakdown/checkout while active and unexpired
export const isPromoUsable = (promo: any) =>
    Boolean(promo && promo.isActive && new Date(promo.expiryDate).getTime() >= Date.now());

// Every productId must exist, be live, and be owned by the seller who owns the code
export const validateProductsForSeller = async (productIds: string[], sellerId: string) => {
    const products = await Product.find({ _id: { $in: productIds } }).select("_id userId isDeleted name");
    const foundIds = new Set(products.map((product: any) => String(product._id)));
    const missing = productIds.filter((id) => !foundIds.has(String(id)));
    if (missing.length) throw new BadRequestError(`Product(s) not found: ${missing.join(", ")}`);
    const notOwned = products.filter((product: any) => String(product.userId) !== String(sellerId) || product.isDeleted);
    if (notOwned.length) throw new BadRequestError("Promo codes can only be created for your own active products");
    return products;
};