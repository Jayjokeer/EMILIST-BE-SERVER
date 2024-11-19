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
exports.fetchUserProducts = exports.deleteProduct = exports.fetchAllProducts = exports.fetchProductById = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const createProduct = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.create(data);
});
exports.createProduct = createProduct;
const fetchProductById = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.findById(productId);
});
exports.fetchProductById = fetchProductById;
const fetchAllProducts = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const totalProducts = yield product_model_1.default.countDocuments().skip(skip).limit(limit);
    const products = yield product_model_1.default.find();
    return {
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts
    };
});
exports.fetchAllProducts = fetchAllProducts;
const deleteProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.findByIdAndDelete(productId);
});
exports.deleteProduct = deleteProduct;
const fetchUserProducts = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const totalProducts = yield product_model_1.default.countDocuments({ userId: userId }).skip(skip).limit(limit);
    const products = yield product_model_1.default.find({ userId: userId });
    return {
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts
    };
});
exports.fetchUserProducts = fetchUserProducts;
