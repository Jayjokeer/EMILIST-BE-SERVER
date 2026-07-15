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
exports.getCartController = exports.generateDiscountCode = exports.checkoutCartController = exports.applyDiscountCode = exports.decreaseCartProductQuantityController = exports.increaseCartProductQuantityController = exports.clearCartController = exports.removeFromCartController = exports.addToCartController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const error_1 = require("../errors/error");
const cart_enum_1 = require("../enums/cart.enum");
const order_enum_1 = require("../enums/order.enum");
const cartService = __importStar(require("../services/cart.service"));
const orderService = __importStar(require("../services/order.service"));
const productService = __importStar(require("../services/product.service"));
const transactionService = __importStar(require("../services/transaction.service"));
const SHIPPING_FEE = 9000;
const cartItemCount = (cart) => (cart.products || []).reduce((total, item) => total + item.quantity, 0);
const cartProductId = (item) => String(item.productId?._id || item.productId);
const cartResponse = async (cart) => {
    const populatedCart = await cart.populate("products.productId");
    const data = populatedCart.toObject();
    return {
        ...data,
        products: (data.products || []).map((item) => ({ ...item, lineTotal: item.quantity * item.price })),
        cartQuantity: cartItemCount(populatedCart),
        orderSummary: await calculateOrderTotals(data.totalAmount || 0, 0),
    };
};
const calculateOrderTotals = async (subtotal, discountAmount) => {
    const config = await transactionService.getVat();
    const taxRate = Number(config?.vat ?? 0) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((discountedSubtotal * taxRate).toFixed(2));
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
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(cart));
});
exports.clearCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    cart.products = [];
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
exports.applyDiscountCode = (0, error_handler_1.catchAsync)(async (req, res) => {
    const code = String(req.body.code || "").trim();
    if (!code)
        throw new error_1.BadRequestError("Discount code is required");
    const [discount, cart] = await Promise.all([cartService.fetchDiscountCode(code), cartService.fetchCartByUser(req.user._id)]);
    if (!discount)
        throw new error_1.NotFoundError("Invalid or expired discount code");
    if (!cart || !cart.products?.length)
        throw new error_1.BadRequestError("Your cart is empty");
    const discountAmount = Number((cart.totalAmount * discount.discountPercentage / 100).toFixed(2));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { code: discount.code, discountPercentage: discount.discountPercentage, ...await calculateOrderTotals(cart.totalAmount, discountAmount) });
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
    let discount;
    if (code?.trim()) {
        discount = await cartService.fetchDiscountCode(code);
        if (!discount)
            throw new error_1.NotFoundError("Invalid or expired discount code");
    }
    for (const item of cart.products) {
        const product = await productService.fetchProductById(item.productId);
        if (!product || Number(product.availableQuantity) < item.quantity) {
            throw new error_1.BadRequestError(`Product ${product?.name || item.productId} is out of stock`);
        }
    }
    const discountAmount = discount ? Number((cart.totalAmount * discount.discountPercentage / 100).toFixed(2)) : 0;
    const totals = await calculateOrderTotals(cart.totalAmount, discountAmount);
    const order = await orderService.createOrder({
        userId,
        products: cart.products.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
        ...totals,
        discountApplied: Boolean(discount),
        originalTotalAmount: cart.totalAmount,
        discountCode: discount?.code,
        shippingAddress: shippingAddress || undefined,
        orderNote: orderNote || undefined,
        status: order_enum_1.OrderStatus.pending,
        paymentStatus: order_enum_1.OrderPaymentStatus.unpaid,
        cartId: cart._id,
    });
    if (discount)
        await cartService.incrementDiscountUsage(String(discount._id));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, order);
});
exports.generateDiscountCode = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { discountPercentage, expiryDate, isSingleUse } = req.body;
    const code = Math.random().toString(36).slice(2, 9).toUpperCase();
    const discountCode = await cartService.createDiscount({ code, discountPercentage, expiryDate, isSingleUse, createdBy: req.user._id });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, discountCode);
});
exports.getCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const cart = await cartService.fetchCartByUser(req.user._id);
    if (!cart)
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { products: [], totalAmount: 0, cartQuantity: 0, status: cart_enum_1.CartStatus.active });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await cartResponse(cart));
});
