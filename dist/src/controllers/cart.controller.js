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
exports.getCartController = exports.generateDiscountCode = exports.applyDiscountCode = exports.decreaseCartProductQuantityController = exports.increaseCartProductQuantityController = exports.checkoutCartController = exports.removeFromCartController = exports.addToCartController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const http_status_codes_1 = require("http-status-codes");
const cartService = __importStar(require("../services/cart.service"));
const productService = __importStar(require("../services/product.service"));
const error_1 = require("../errors/error");
const order_enum_1 = require("../enums/order.enum");
const orderService = __importStar(require("../services/order.service"));
exports.addToCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const product = await productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product not found!");
    if (String(product.userId) === String(userId)) {
        throw new error_1.BadRequestError("You cannot add your product to the cart");
    }
    const productPrice = product.isDiscounted && product.discountedPrice ? product.discountedPrice : product.price;
    let cart = await cartService.fetchCartByUser(userId);
    if (!cart) {
        const payload = {
            userId,
            products: [{ productId, quantity, price: productPrice }],
            totalAmount: productPrice * quantity,
        };
        cart = await cartService.createCart(payload);
        const cartQuantity = payload.products.reduce((sum, p) => sum + p.quantity, 0);
        const data = { ...cart.toObject(), cartQuantity };
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    const cartCompare = await cartService.fetchCartById(String(cart._id));
    const existingProductIndex = cartCompare.products.findIndex((p) => p.productId.toString() === productId.toString());
    if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity;
        cart.products[existingProductIndex].price = productPrice;
    }
    else {
        cart.products.push({ productId, quantity, price: productPrice });
    }
    cart.totalAmount = cart.products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const savedCart = await cart.save();
    const cartQuantity = savedCart.products.reduce((sum, p) => sum + p.quantity, 0);
    const productsWithDetails = await Promise.all(savedCart.products.map(async (item) => {
        const productDetails = await productService.fetchProductById(item.productId);
        return {
            productId: productDetails || item.productId,
            quantity: item.quantity,
            price: item.price,
        };
    }));
    const data = { ...savedCart.toObject(), products: productsWithDetails, cartQuantity };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.removeFromCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found!");
    const cartCompare = await cartService.fetchCartById(String(cart._id));
    cart.products = cartCompare.products?.filter((p) => p.productId.toString() !== productId);
    cart.totalAmount = cart.products?.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const data = await cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.checkoutCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { code } = req.body;
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    let discountPercentage = 0;
    let discountAmount = 0;
    let finalTotalAmount = cart.totalAmount;
    if (code) {
        const validDiscountCode = await cartService.fetchDiscountCode(code);
        if (!validDiscountCode) {
            throw new error_1.NotFoundError("Invalid or expired discount code");
        }
        discountPercentage = validDiscountCode.discountPercentage;
        validDiscountCode.useCount += 1;
        if (validDiscountCode.isSingleUse) {
            validDiscountCode.isActive = false;
        }
        await validDiscountCode.save();
        discountAmount = (cart.totalAmount * discountPercentage) / 100;
        finalTotalAmount = cart.totalAmount - discountAmount;
    }
    for (const cartItem of cart.products) {
        const product = await productService.fetchProductById(cartItem.productId);
        if (!product || Number(product.availableQuantity) < cartItem.quantity) {
            throw new error_1.NotFoundError(`Product ${product?.name} is out of stock`);
        }
        product.availableQuantity = product.availableQuantity - cartItem.quantity;
        await product.save();
    }
    const orderPayload = {
        userId,
        products: cart.products?.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        })),
        totalAmount: finalTotalAmount,
        discountApplied: discountAmount > 0,
        discountAmount,
        originalTotalAmount: cart.totalAmount,
        status: order_enum_1.OrderStatus.pending,
        paymentStatus: order_enum_1.OrderPaymentStatus.unpaid,
        discountCode: code,
        cartId: cart._id,
    };
    const order = await orderService.createOrder(orderPayload);
    await cart.save();
    const data = order;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.increaseCartProductQuantityController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const cartCompare = await cartService.fetchCartById(String(cart._id));
    const cartProduct = cartCompare.products?.find((item) => item.productId.toString() === productId);
    if (!cartProduct)
        throw new error_1.NotFoundError("Product not found in cart");
    const product = await productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product does not exist");
    if (cartProduct.quantity + 1 > Number(product.availableQuantity)) {
        throw new error_1.NotFoundError("Not enough product available in stock");
    }
    cartProduct.quantity += 1;
    cartCompare.totalAmount = cartCompare.products?.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const data = await cartCompare.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.decreaseCartProductQuantityController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const cartCompare = await cartService.fetchCartById(String(cart._id));
    const cartProduct = cartCompare.products?.find((item) => item.productId.toString() === productId);
    if (!cartProduct)
        throw new error_1.NotFoundError("Product not found in cart");
    if (cartProduct.quantity === 1) {
        throw new error_1.BadRequestError("Cannot decrease quantity below 1");
    }
    cartProduct.quantity -= 1;
    cartCompare.totalAmount = cartCompare.products?.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const data = await cartCompare.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.applyDiscountCode = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { code } = req.body;
    const userId = req.user._id;
    const discountCode = await cartService.fetchDiscountCode(code);
    if (!discountCode) {
        throw new error_1.NotFoundError("Invalid or expired discount code");
    }
    const cart = await cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const discountAmount = (cart.totalAmount * discountCode.discountPercentage) / 100;
    const discountedTotal = cart.totalAmount - discountAmount;
    const data = {
        originalAmount: cart.totalAmount,
        discountAmount,
        discountedTotal,
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.generateDiscountCode = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { discountPercentage, expiryDate, isSingleUse } = req.body;
    const code = `${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
    const discountCode = await cartService.createDiscount({
        code,
        discountPercentage,
        expiryDate,
        isSingleUse,
        createdBy: req.user._id,
    });
    const data = discountCode;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.getCartController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const data = await cartService.fetchCartByUser(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
