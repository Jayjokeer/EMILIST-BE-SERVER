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
exports.decreaseCartProductQuantityController = exports.increaseCartProductQuantityController = exports.checkoutCartController = exports.removeFromCartController = exports.addToCartController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const http_status_codes_1 = require("http-status-codes");
const cartService = __importStar(require("../services/cart.service"));
const productService = __importStar(require("../services/product.service"));
const error_1 = require("../errors/error");
const cart_enum_1 = require("../enums/cart.enum");
exports.addToCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const product = yield productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product not found!");
    if (String(product.userId) === String(userId)) {
        throw new error_1.BadRequestError("You cannot add your product to cart");
    }
    let cart = yield cartService.fetchCartByUser(userId);
    const productPrice = product.price;
    if (!cart) {
        const payload = {
            userId,
            products: [{ productId, quantity, price: productPrice }],
            totalAmount: productPrice * quantity,
        };
        cart = yield cartService.createCart(payload);
        const data = cart;
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    const existingProduct = (_a = cart.products) === null || _a === void 0 ? void 0 : _a.find((p) => p.productId.toString() === productId);
    if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.price = productPrice;
    }
    else {
        (_b = cart.products) === null || _b === void 0 ? void 0 : _b.push({ productId, quantity, price: productPrice });
    }
    cart.totalAmount = (_c = cart.products) === null || _c === void 0 ? void 0 : _c.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const data = yield cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.removeFromCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found!");
    cart.products = (_a = cart.products) === null || _a === void 0 ? void 0 : _a.filter((p) => p.productId.toString() !== productId);
    cart.totalAmount = (_b = cart.products) === null || _b === void 0 ? void 0 : _b.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const data = yield cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.checkoutCartController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    cart.status = cart_enum_1.CartStatus.checkedOut;
    const data = yield cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.increaseCartProductQuantityController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const cartProduct = (_a = cart.products) === null || _a === void 0 ? void 0 : _a.find((item) => item.productId.toString() === productId);
    if (!cartProduct)
        throw new error_1.NotFoundError("Product not found in cart");
    const product = yield productService.fetchProductById(productId);
    if (!product)
        throw new error_1.NotFoundError("Product does not exist");
    if (cartProduct.quantity + 1 > Number(product.availableQuantity)) {
        throw new error_1.NotFoundError("Not enough product available in stock");
    }
    cartProduct.quantity += 1;
    cart.totalAmount = (_b = cart.products) === null || _b === void 0 ? void 0 : _b.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const data = yield cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.decreaseCartProductQuantityController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId } = req.params;
    const cart = yield cartService.fetchCartByUser(userId);
    if (!cart)
        throw new error_1.NotFoundError("Cart not found");
    const cartProduct = (_a = cart.products) === null || _a === void 0 ? void 0 : _a.find((item) => item.productId.toString() === productId);
    if (!cartProduct)
        throw new error_1.NotFoundError("Product not found in cart");
    if (cartProduct.quantity === 1) {
        throw new error_1.BadRequestError("Cannot decrease quantity below 1");
    }
    cartProduct.quantity -= 1;
    cart.totalAmount = (_b = cart.products) === null || _b === void 0 ? void 0 : _b.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const data = yield cart.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
