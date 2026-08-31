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
exports.getCartController = exports.checkoutCartController = exports.removePromoCodeController = exports.applyPromoCodeController = exports.decreaseCartProductQuantityController = exports.increaseCartProductQuantityController = exports.clearCartController = exports.removeFromCartController = exports.addToCartController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const error_1 = require("../errors/error");
const cart_enum_1 = require("../enums/cart.enum");
const order_enum_1 = require("../enums/order.enum");
const cartService = __importStar(require("../services/cart.service"));
const orderService = __importStar(require("../services/order.service"));
const productService = __importStar(require("../services/product.service"));
const promoService = __importStar(require("../services/promo.service"));
// Delivery fee is defaulted to 0 for now
const SHIPPING_FEE = 0;
const cartItemCount = (cart) => (cart.products || []).reduce((total, item) => total + item.quantity, 0);
const cartProductId = (item) => String(item.productId?._id || item.productId);
// Per-line financials for the cart:
// 1. Promos - resolves every applied code into a per-code/per-product breakdown.
//    A promo only counts while it is active/unexpired and at least one of its
//    scoped products is still in the cart.
// 2. Tax - each product's own taxPercentage (0 = tax free) applied to the
//    post-promo line amount.
const computeCartFinancials = async (cart) => {
    const applied = cart.appliedPromoCodes || [];
    const cartItems = cart.products || [];
    const promoDiscountPerProduct = new Map();
    const taxPerProduct = new Map();
    const appliedPromos = [];
    let totalDiscount = 0;
    let totalTax = 0;
    if (applied.length) {
        const promos = await promoService.fetchPromosByIds(applied.map((entry) => String(entry.discountId)));
        for (const entry of applied) {
            const promo = promos.find((p) => String(p._id) === String(entry.discountId));
            if (!promo || !promoService.isPromoUsable(promo))
                continue;
            const scopeIds = (promo.productIds || []).map((id) => String(id));
            const products = cartItems
                .filter((item) => scopeIds.includes(cartProductId(item)))
                .map((item) => {
                const lineTotal = item.quantity * item.price;
                const lineDiscount = Number((lineTotal * promo.discountPercentage / 100).toFixed(2));
                totalDiscount += lineDiscount;
                const productId = cartProductId(item);
                promoDiscountPerProduct.set(productId, (promoDiscountPerProduct.get(productId) || 0) + lineDiscount);
                const productDoc = item.productId;
                return {
                    productId,
                    productName: productDoc?.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    lineTotal,
                    discountAmount: lineDiscount,
                };
            });
            appliedPromos.push({
                code: promo.code,
                discountPercentage: promo.discountPercentage,
                expiryDate: promo.expiryDate,
                sellerId: promo.sellerId,
                discountAmount: Number(products.reduce((sum, p) => sum + p.discountAmount, 0).toFixed(2)),
                products,
            });
        }
    }
    // Tax is charged per product line on the post-promo amount; products default
    // to tax free (rate 0 / unset).
    for (const item of cartItems) {
        const productId = cartProductId(item);
        const lineNet = Math.max(0, item.quantity * item.price - (promoDiscountPerProduct.get(productId) || 0));
        const taxRate = Number(item.productId?.taxPercentage ?? 0) || 0;
        const lineTax = Number((lineNet * taxRate / 100).toFixed(2));
        totalTax += lineTax;
        taxPerProduct.set(productId, lineTax);
    }
    return {
        appliedPromos,
        promoDiscountAmount: Number(totalDiscount.toFixed(2)),
        promoDiscountPerProduct,
        taxAmount: Number(totalTax.toFixed(2)),
        taxPerProduct,
    };
};
const cartResponse = async (cart) => {
    const populatedCart = await cart.populate({
        path: "products.productId",
        populate: {
            path: "category",
            select: "name slug",
        },
    });
    const data = populatedCart.toObject();
    const { appliedPromos, promoDiscountAmount, promoDiscountPerProduct, taxAmount, taxPerProduct } = await computeCartFinancials(populatedCart);
    return {
        ...data,
        products: (data.products || []).map((item) => {
            // Ensure category is properly shaped (id + name, not just an object id)
            const product = item.productId || {};
            if (product.category && typeof product.category === 'object' && product.category._id) {
                product.category = {
                    id: product.category._id,
                    name: product.category.name || '',
                    slug: product.category.slug || '',
                };
            }
            return {
                ...item,
                lineTotal: item.quantity * item.price,
                promoDiscountAmount: promoDiscountPerProduct.get(cartProductId(item)) || 0,
                taxAmount: taxPerProduct.get(cartProductId(item)) || 0,
            };
        }),
        appliedPromos,
        promoDiscountAmount,
        cartQuantity: cartItemCount(populatedCart),
        orderSummary: calculateOrderTotals(data.totalAmount || 0, promoDiscountAmount, taxAmount),
    };
};
// Tax is computed per product line (each product's own taxPercentage, 0 = tax
// free) and passed in already summed; delivery fee is currently 0.
const calculateOrderTotals = (subtotal, discountAmount, taxAmount) => {
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const totalAmount = Number((discountedSubtotal + taxAmount + SHIPPING_FEE).toFixed(2));
    return { subtotalAmount: subtotal, discountAmount, taxAmount, shippingAmount: SHIPPING_FEE, totalAmount };
};
exports.addToCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const product = await productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product not found");
    if (String(product.userId) === String(userId))
        throw new error_1.BadRequestError("You cannot add your own product to the cart");
    if (Number(product.availableQuantity) < quantity)
        throw new error_1.BadRequestError("Not enough product available in stock");
    const price = product.isDiscounted && product.discountedPrice != null ? product.discountedPrice : product.price;
    let cart = await cartService.fetchCartByUser(userId);
    if (!cart) {
        cart = await cartService.createCart({
            userId,
            products: [{ productId, quantity, price }],
            totalAmount: price * quantity,
        });
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, await cartResponse(cart));
    }
    const item = cart.products?.find((entry) => cartProductId(entry) === String(productId));
    if (item) {
        if (item.quantity + quantity > Number(product.availableQuantity))
            throw new error_1.BadRequestError("Not enough product available in stock");
        item.quantity += quantity;
        item.price = price;
    }
    else {
        cart.products?.push({ productId, quantity, price });
    }
    cart.totalAmount = (cart.products || []).reduce((total, entry) => total + entry.quantity * entry.price, 0);
    await cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(cart));
});
exports.removeFromCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const originalCount = cart.products?.length || 0;
    cart.products = (cart.products || []).filter((item) => cartProductId(item) !== req.params.productId);
    if (cart.products.length === originalCount)
        throw new error_1.NotFoundError("Product not found in cart");
    cart.totalAmount = cart.products.reduce((total, item) => total + item.quantity * item.price, 0);
    await cart.save();
    const prunedCart = await cartService.pruneAppliedPromos(cart);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(prunedCart));
});
exports.clearCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    cart.products = [];
    cart.appliedPromoCodes = [];
    cart.totalAmount = 0;
    await cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(cart));
});
const changeQuantity = async (userId, productId, adjustment) => {
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    console.log(productId, cart.products);
    const item = cart.products?.find((entry) => cartProductId(entry) === productId);
    if (!item)
        throw new error_1.NotFoundError("Product not found in cart");
    if (adjustment === -1 && item.quantity === 1)
        throw new error_1.BadRequestError("Cannot decrease quantity below 1; remove the item instead");
    if (adjustment === 1) {
        const product = await productService.fetchProductById(productId);
        if (!product)
            throw new error_1.NotFoundError("Product does not exist");
        if (item.quantity + 1 > Number(product.availableQuantity))
            throw new error_1.BadRequestError("Not enough product available in stock");
        item.price = product.isDiscounted && product.discountedPrice != null ? product.discountedPrice : product.price;
    }
    item.quantity += adjustment;
    cart.totalAmount = (cart.products || []).reduce((total, entry) => total + entry.quantity * entry.price, 0);
    await cart.save();
    return cart;
};
exports.increaseCartProductQuantityController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await changeQuantity(req.user._id, req.params.productId, 1);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(cart));
});
exports.decreaseCartProductQuantityController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await changeQuantity(req.user._id, req.params.productId, -1);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(cart));
});
exports.applyPromoCodeController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const code = String(req.body.code || "").trim();
    if (!code)
        throw new error_1.BadRequestError("Promo code is required");
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart || !cart.products?.length)
        throw new error_1.BadRequestError("Your cart is empty");
    const promo = await promoService.fetchPromoByCode(code);
    if (!promo)
        throw new error_1.NotFoundError("Invalid or expired promo code");
    if ((cart.appliedPromoCodes || []).some((entry) => String(entry.discountId) === String(promo._id))) {
        throw new error_1.BadRequestError("This promo code is already applied to your cart");
    }
    // Product-scoped: the code is useless unless one of its products is in the cart
    const scopeIds = (promo.productIds || []).map((id) => String(id));
    const cartProductIds = new Set(cart.products.map((item) => cartProductId(item)));
    if (!scopeIds.some((id) => cartProductIds.has(id))) {
        throw new error_1.BadRequestError("This promo code does not apply to any product in your cart");
    }
    // One code per seller and no product overlap between applied codes
    const existingIds = (cart.appliedPromoCodes || []).map((entry) => String(entry.discountId));
    const existingPromos = existingIds.length ? await promoService.fetchPromosByIds(existingIds) : [];
    const sameSeller = existingPromos.find((p) => String(p.sellerId) === String(promo.sellerId));
    if (sameSeller)
        throw new error_1.BadRequestError(`Promo code ${sameSeller.code} from this seller is already applied - only one code per seller`);
    const overlapping = existingPromos.find((p) => (p.productIds || []).some((id) => scopeIds.includes(String(id))));
    if (overlapping)
        throw new error_1.BadRequestError(`Promo code ${overlapping.code} already covers one or more of these products`);
    await cartService.addAppliedPromo(cart, promo);
    const freshCart = await cartService.fetchCartByUser(req.user._id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: `Promo code ${promo.code} applied`,
        ...(await cartResponse(freshCart)),
    });
});
exports.removePromoCodeController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const code = String(req.params.code || "").trim().toUpperCase();
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    if (!(cart.appliedPromoCodes || []).some((entry) => entry.code === code)) {
        throw new error_1.NotFoundError("This promo code is not applied to your cart");
    }
    await cartService.removeAppliedPromo(cart, code);
    const freshCart = await cartService.fetchCartByUser(req.user._id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: `Promo code ${code} removed`,
        ...(await cartResponse(freshCart)),
    });
});
exports.checkoutCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { code, shippingAddress, orderNote } = req.body;
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart || !cart.products?.length)
        throw new error_1.BadRequestError("Your cart is empty");
    const existingOrder = await orderService.fetchOrderByCartIdForUser(String(cart._id), String(userId));
    if (existingOrder)
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, existingOrder);
    // === Resolve promos for this checkout ===
    // Codes already applied on the cart are the source of truth. An optional
    // inline `code` in the body is still honoured for backward compatibility.
    const appliedEntries = [...(cart.appliedPromoCodes || [])];
    let inlinePromo = null;
    if (code?.trim()) {
        inlinePromo = await promoService.fetchPromoByCode(code);
        if (!inlinePromo)
            throw new error_1.NotFoundError("Invalid or expired promo code");
        if (!appliedEntries.some((entry) => String(entry.discountId) === String(inlinePromo._id))) {
            appliedEntries.push({ discountId: inlinePromo._id, code: inlinePromo.code });
        }
    }
    const appliedPromos = appliedEntries.length
        ? await promoService.fetchPromosByIds(appliedEntries.map((entry) => String(entry.discountId)))
        : [];
    const cartProductIds = new Set(cart.products.map((item) => cartProductId(item)));
    // Stale applied codes (expired/revoked/no longer in cart) are skipped silently...
    let effectivePromos = appliedPromos.filter((promo) => promoService.isPromoUsable(promo) && (promo.productIds || []).some((id) => cartProductIds.has(String(id))));
    // ...but an explicitly typed inline code that conflicts is a hard error
    if (inlinePromo) {
        const sameSeller = effectivePromos.find((p) => String(p._id) !== String(inlinePromo._id) && String(p.sellerId) === String(inlinePromo.sellerId));
        if (sameSeller)
            throw new error_1.BadRequestError(`Promo code ${sameSeller.code} from this seller is already applied - only one code per seller`);
        const overlapping = effectivePromos.find((p) => String(p._id) !== String(inlinePromo._id) &&
            (p.productIds || []).some((id) => (inlinePromo.productIds || []).some((pid) => String(pid) === String(id))));
        if (overlapping)
            throw new error_1.BadRequestError(`Promo code ${overlapping.code} already covers one or more of these products`);
        if (!effectivePromos.some((p) => String(p._id) === String(inlinePromo._id))) {
            effectivePromos = [...effectivePromos, inlinePromo];
        }
    }
    // Each cart line is covered by at most one promo (one code per seller and no
    // product overlap between codes are enforced at apply time)
    const promoByProduct = new Map();
    for (const promo of effectivePromos) {
        for (const id of promo.productIds || []) {
            const productId = String(id);
            if (cartProductIds.has(productId))
                promoByProduct.set(productId, promo);
        }
    }
    let promoDiscountTotal = 0;
    let taxTotal = 0;
    // Build order products WITH snapshots captured at order-creation time.
    // Product name/brand/category/price + merchant name/rating/review count are
    // stored on the order itself so later changes never alter past orders.
    const orderProducts = [];
    for (const item of cart.products) {
        const product = await productService.fetchProductById(item.productId);
        if (!product || Number(product.availableQuantity) < item.quantity) {
            throw new error_1.BadRequestError(`Product ${product?.name || item.productId} is out of stock`);
        }
        const category = product.category
            ? await productService.fetchSingleCategory(String(product.category))
            : null;
        const merchantRating = await productService.fetchMerchantRatingForSeller(String(product.userId));
        const primaryImage = product.images?.find((img) => img.isPrimary);
        const linePromo = promoByProduct.get(String(product._id));
        const lineDiscount = linePromo ? Number((item.quantity * item.price * linePromo.discountPercentage / 100).toFixed(2)) : 0;
        promoDiscountTotal += lineDiscount;
        // Tax is charged per product (taxPercentage, 0 = tax free) on the post-promo line amount
        const lineTaxRate = Number(product.taxPercentage ?? 0) || 0;
        const lineTax = Number((Math.max(0, item.quantity * item.price - lineDiscount) * lineTaxRate / 100).toFixed(2));
        taxTotal += lineTax;
        orderProducts.push({
            productId: product._id,
            quantity: item.quantity,
            price: item.price,
            productName: product.name,
            brand: product.brand,
            categoryName: category?.name || "",
            thumbnail: primaryImage?.imageUrl || product.images?.[0]?.imageUrl || "",
            quantityMetric: product.quantityMetric,
            merchantId: product.userId,
            merchantName: product.merchantName,
            merchantRating: merchantRating.merchantRating,
            merchantReviewCount: merchantRating.merchantReviewCount,
            totalUnitsSoldAtPurchase: product.totalUnitsSold || 0,
            // Promo snapshot: which code hit this line and how much it saved
            discountAmount: lineDiscount,
            promoCode: linePromo?.code,
            // Tax snapshot: the product's own rate and what this line was charged
            taxPercentage: lineTaxRate,
            taxAmount: lineTax,
        });
    }
    const discountAmount = Number(promoDiscountTotal.toFixed(2));
    const totals = calculateOrderTotals(cart.totalAmount, discountAmount, Number(taxTotal.toFixed(2)));
    const order = await orderService.createOrder({
        userId,
        products: orderProducts,
        ...totals,
        discountApplied: discountAmount > 0,
        originalTotalAmount: cart.totalAmount,
        promoCodes: [...new Set(effectivePromos.map((promo) => promo.code))],
        discountCode: effectivePromos[0]?.code,
        shippingAddress: shippingAddress || undefined,
        orderNote: orderNote || undefined,
        status: order_enum_1.OrderStatus.pending,
        paymentStatus: order_enum_1.OrderPaymentStatus.unpaid,
        cartId: cart._id,
    });
    for (const promo of effectivePromos) {
        await promoService.incrementPromoUsage(String(promo._id));
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, order);
});
exports.getCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart)
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { products: [], appliedPromos: [], promoDiscountAmount: 0, totalAmount: 0, cartQuantity: 0, status: cart_enum_1.CartStatus.active });
    const prunedCart = await cartService.pruneAppliedPromos(cart);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(prunedCart));
});
