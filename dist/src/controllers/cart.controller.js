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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
exports.addToCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const product = yield productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product not found!");
    if (String(product.userId) === String(userId)) {
        throw new error_1.BadRequestError("You cannot add your product to the cart");
    }
    const productPrice = product.isDiscounted && product.discountedPrice ? product.discountedPrice : product.price;
    let cart = yield cartService.fetchCartByUser(userId);
    if (!cart) {
        const payload = {
            userId,
            products: [{ productId, quantity, price: productPrice }],
            totalAmount: productPrice * quantity,
        };
        cart = yield cartService.createCart(payload);
        const cartQuantity = payload.products.reduce((sum, p) => sum + p.quantity, 0);
        const data = Object.assign(Object.assign({}, cart.toObject()), { cartQuantity });
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    const cartCompare = yield cartService.fetchCartById(String(cart._id));
    const existingProductIndex = cartCompare.products.findIndex((p) => p.productId.toString() === productId.toString());
    if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity;
        cart.products[existingProductIndex].price = productPrice;
    }
    else {
        cart.products.push({ productId, quantity, price: productPrice });
    }
    cart.totalAmount = cart.products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const savedCart = yield cart.save();
    const cartQuantity = savedCart.products.reduce((sum, p) => sum + p.quantity, 0);
    const productsWithDetails = yield Promise.all(savedCart.products.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const productDetails = yield productService.fetchProductById(item.productId);
        return {
            productId: productDetails || item.productId,
            quantity: item.quantity,
            price: item.price,
        };
    })));
    const data = Object.assign(Object.assign({}, savedCart.toObject()), { products: productsWithDetails, cartQuantity });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.removeFromCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found!");
    const cartCompare = yield cartService.fetchCartById(String(cart._id));
    cart.products = (_a = cartCompare.products) === null || _a === void 0 ? void 0 : _a.filter((p) => p.productId.toString() !== productId);
    cart.totalAmount = (_b = cart.products) === null || _b === void 0 ? void 0 : _b.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const data = yield cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.checkoutCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const { code } = req.body;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    let discountPercentage = 0;
    let discountAmount = 0;
    let finalTotalAmount = 0;
    if (code) {
        const validDiscountCode = yield cartService.fetchDiscountCode(code);
        if (!validDiscountCode) {
            throw new error_1.NotFoundError("Invalid or expired discount code");
        }
        discountPercentage = validDiscountCode.discountPercentage;
        validDiscountCode.useCount += 1;
        if (validDiscountCode.isSingleUse) {
            validDiscountCode.isActive = false;
        }
        yield validDiscountCode.save();
        discountAmount = (cart.totalAmount * discountPercentage) / 100;
        finalTotalAmount = cart.totalAmount - discountAmount;
    }
    for (const cartItem of cart.products) {
        const product = yield productService.fetchProductById(cartItem.productId);
        if (!product || Number(product.availableQuantity) < cartItem.quantity) {
            throw new error_1.NotFoundError(`Product ${product === null || product === void 0 ? void 0 : product.name} is out of stock`);
        }
        product.availableQuantity = product.availableQuantity - cartItem.quantity;
        yield product.save();
    }
    const orderPayload = {
        userId,
        products: (_a = cart.products) === null || _a === void 0 ? void 0 : _a.map((item) => ({
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
    const order = yield orderService.createOrder(orderPayload);
    yield cart.save();
    const data = order;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.increaseCartProductQuantityController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const cartCompare = yield cartService.fetchCartById(String(cart._id));
    const cartProduct = (_a = cartCompare.products) === null || _a === void 0 ? void 0 : _a.find((item) => item.productId.toString() === productId);
    if (!cartProduct)
        throw new error_1.NotFoundError("Product not found in cart");
    const product = yield productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product does not exist");
    if (cartProduct.quantity + 1 > Number(product.availableQuantity)) {
        throw new error_1.NotFoundError("Not enough product available in stock");
    }
    cartProduct.quantity += 1;
    cartCompare.totalAmount = (_b = cartCompare.products) === null || _b === void 0 ? void 0 : _b.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const data = yield cartCompare.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.decreaseCartProductQuantityController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const cartCompare = yield cartService.fetchCartById(String(cart._id));
    const cartProduct = (_a = cartCompare.products) === null || _a === void 0 ? void 0 : _a.find((item) => item.productId.toString() === productId);
    if (!cartProduct)
        throw new error_1.NotFoundError("Product not found in cart");
    if (cartProduct.quantity === 1) {
        throw new error_1.BadRequestError("Cannot decrease quantity below 1");
    }
    cartProduct.quantity -= 1;
    cartCompare.totalAmount = (_b = cartCompare.products) === null || _b === void 0 ? void 0 : _b.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const data = yield cartCompare.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.applyDiscountCode = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    const userId = req.user._id;
    const discountCode = yield cartService.fetchDiscountCode(code);
    if (!discountCode) {
        throw new error_1.NotFoundError("Invalid or expired discount code");
    }
    const cart = yield cartService.fetchCartByUser(userId);
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
}));
exports.generateDiscountCode = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { discountPercentage, expiryDate, isSingleUse } = req.body;
    const code = `${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
    const discountCode = yield cartService.createDiscount({
        code,
        discountPercentage,
        expiryDate,
        isSingleUse,
        createdBy: req.user._id,
    });
    const data = discountCode;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.getCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const data = yield cartService.fetchCartByUser(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
