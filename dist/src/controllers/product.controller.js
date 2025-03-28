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
exports.fetchAllComparedProductsController = exports.compareProductController = exports.fetchProductReviewsController = exports.fetchSimilarProductByUserController = exports.fetchOtherProductByUserController = exports.addDiscountToProductController = exports.reviewProductController = exports.unlikeProductsController = exports.fetchAllLikedProductsController = exports.likeProductsController = exports.getUserProductsController = exports.deleteProductImageController = exports.deleteProductController = exports.getAllProductsController = exports.getSingleProductController = exports.updateProductController = exports.createProductController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const productService = __importStar(require("../services/product.service"));
const http_status_codes_1 = require("http-status-codes");
const error_1 = require("../errors/error");
const reviewService = __importStar(require("../services/review.service"));
const subscriptionService = __importStar(require("../services/subscription.service"));
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const userService = __importStar(require("../services/auth.service"));
exports.createProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const payload = req.body;
    payload.userId = userId;
    if (req.files) {
        payload.images = req.files.map((file) => ({
            imageUrl: file.path,
        }));
    }
    const subscription = yield subscriptionService.getActiveSubscription(userId);
    if (!subscription) {
        throw new error_1.BadRequestError("You do not have an active subscription.");
    }
    const productPerk = subscription.perks.find((perk) => perk.name === suscribtion_enum_1.SubscriptionPerksEnum.product);
    if (!productPerk) {
        throw new error_1.BadRequestError("Your subscription does not include the ability to create products.");
    }
    if (productPerk.used >= productPerk.limit) {
        throw new error_1.BadRequestError("You have reached the limit of products you can create with your subscription.");
    }
    const data = yield productService.createProduct(payload);
    productPerk.used += 1;
    yield subscription.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.updateProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { productId } = req.params;
    const updates = req.body;
    const files = req.files;
    const product = yield productService.fetchProductById(productId);
    if (String(product === null || product === void 0 ? void 0 : product.userId) != String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    Object.keys(updates).forEach((key) => {
        product[key] = updates[key];
    });
    if (files && files.length > 0) {
        const newImages = files.map((file) => ({
            imageUrl: file.path,
        }));
        product.images.push(...newImages);
    }
    yield product.save();
    const data = yield productService.fetchProductById(productId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.getSingleProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const product = yield productService.fetchProductByIdWithDetails(productId);
    const { userId } = req.query;
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    let liked = false;
    let isCompared = false;
    if (userId) {
        const likedProduct = yield productService.ifLikedProduct(productId, userId);
        liked = !!likedProduct;
        const user = yield userService.findUserById(userId);
        if (user) {
            isCompared = user.comparedProducts.some((id) => id.toString() === productId);
        }
    }
    const reviewAggregation = yield productService.fetchReviewForProduct(productId);
    const review = reviewAggregation[0] || { averageRating: 0, numberOfRatings: 0, reviews: [] };
    const data = {
        product,
        liked,
        isCompared,
        averageRating: review.averageRating || 0,
        numberOfRatings: review.numberOfRatings || 0,
        reviewsData: review.reviews || [],
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.getAllProductsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, priceRange, minRating, minReviews, isPrimeMember, location, search, } = req.query;
    const userId = req.query.userId ? req.query.userId : null;
    const filters = {
        priceRange,
        minRating,
        minReviews,
        isPrimeMember,
        location,
    };
    const products = yield productService.fetchAllProducts(Number(page), Number(limit), userId, filters, search);
    const data = products;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.deleteProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = yield productService.fetchProductById(productId);
    if (String(product === null || product === void 0 ? void 0 : product.userId) !== String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    yield productService.deleteProduct(productId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Product deleted successfully!");
}));
exports.deleteProductImageController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.user._id;
    const { productId, imageId } = req.params;
    const product = yield productService.fetchProductById(productId);
    if (String(product === null || product === void 0 ? void 0 : product.userId) !== String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    const imageIndex = (_a = product.images) === null || _a === void 0 ? void 0 : _a.findIndex((image) => image._id.toString() === imageId);
    if (imageIndex === -1) {
        throw new error_1.NotFoundError("Image not found");
    }
    (_b = product.images) === null || _b === void 0 ? void 0 : _b.splice(imageIndex, 1);
    yield product.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Image deleted successfully!");
}));
exports.getUserProductsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const products = yield productService.fetchUserProducts(userId, Number(page), Number(limit));
    const data = products;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.likeProductsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = yield productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    ;
    const existingLike = yield productService.ifLikedProduct(productId, userId);
    if (existingLike) {
        throw new error_1.BadRequestError("Product previously liked!");
    }
    ;
    yield productService.createProductLike({
        product: productId,
        user: userId
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Liked successfully");
}));
exports.fetchAllLikedProductsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const data = yield productService.fetchLikedProducts(userId, page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.unlikeProductsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = yield productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    yield productService.unlikeProduct(productId, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Unliked successfully");
}));
exports.reviewProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const { productId, rating, comment } = req.body;
    const product = yield productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    if (String(product.userId) == String(userId)) {
        throw new error_1.BadRequestError("You cannot review your own product!");
    }
    const isReviewed = yield reviewService.isUserReviewed(productId, userId);
    if (isReviewed) {
        throw new error_1.BadRequestError("You have previously reviewed this product!");
    }
    const payload = {
        productId,
        userId,
        rating,
        comment
    };
    const data = yield reviewService.addReview(payload);
    (_a = product.reviews) === null || _a === void 0 ? void 0 : _a.push(String(data._id));
    yield product.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.addDiscountToProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { productId } = req.params;
    const { discount } = req.body;
    const product = yield productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    if (String(product.userId) !== String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    product.discountedPrice = discount;
    product.isDiscounted = true;
    yield product.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Discount added successfully!");
}));
exports.fetchOtherProductByUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const data = yield productService.otherProductsByUser(userId, page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchSimilarProductByUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const { page = 1, limit = 10, userId } = req.query;
    const data = yield productService.fetchSimilarProducts(productId, limit, page, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchProductReviewsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy } = req.query;
    const data = yield productService.fetchProductReviews(productId, Number(page), Number(limit), sortBy);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.compareProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = yield productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("No product found!");
    }
    ;
    const user = yield userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    const productIndex = user.comparedProducts.findIndex((id) => id.toString() === productId);
    if (productIndex !== -1) {
        user.comparedProducts.splice(productIndex, 1);
    }
    else {
        user.comparedProducts.push(productId);
    }
    yield user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: "Compared products updated successfully",
        comparedProducts: user.comparedProducts,
    });
}));
exports.fetchAllComparedProductsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const user = yield userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    ;
    const products = yield productService.fetchAllComparedProducts(user.comparedProducts);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, products);
}));
