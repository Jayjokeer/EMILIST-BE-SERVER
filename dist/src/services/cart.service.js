"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCart = exports.fetchCartById = exports.fetchCartByUser = exports.createCart = void 0;
const cart_enum_1 = require("../enums/cart.enum");
const cart_model_1 = __importDefault(require("../models/cart.model"));
const createCart = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield cart_model_1.default.create(payload);
});
exports.createCart = createCart;
const fetchCartByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield cart_model_1.default.findOne({ userId, status: cart_enum_1.CartStatus.active }).populate("products.productId");
});
exports.fetchCartByUser = fetchCartByUser;
const fetchCartById = (cartId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield cart_model_1.default.findById(cartId);
});
exports.fetchCartById = fetchCartById;
const deleteCart = (cartId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield cart_model_1.default.findByIdAndDelete(cartId);
});
exports.deleteCart = deleteCart;
