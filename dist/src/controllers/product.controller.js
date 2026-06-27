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
exports.getProductReviewsController = exports.fetchAllComparedProductsController = exports.compareProductController = exports.fetchProductReviewsController = exports.fetchSimilarProductByUserController = exports.fetchOtherProductByUserController = exports.addDiscountToProductController = exports.reviewProductController = exports.unlikeProductsController = exports.fetchAllLikedProductsController = exports.likeProductsController = exports.getUserProductsController = exports.deleteProductImageController = exports.deleteProductController = exports.getAllProductsController = exports.getSingleProductController = exports.updateProductController = exports.createProductController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const productService = __importStar(require("../services/product.service"));
const http_status_codes_1 = require("http-status-codes");
const error_1 = require("../errors/error");
const reviewService = __importStar(require("../services/review.service"));
const subscriptionService = __importStar(require("../services/subscription.service"));
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const userService = __importStar(require("../services/auth.service"));
exports.createProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const payload = { ...req.body };
    payload.userId = userId;
    if (req.files && Array.isArray(req.files)) {
        payload.images = req.files.map((file) => ({
            imageUrl: file.path,
            isPrimary: false,
        }));
    }
    const subscription = await subscriptionService.getActiveSubscription(userId);
    if (!subscription) {
        throw new error_1.BadRequestError("You do not have an active subscription.");
    }
    const productPerk = subscription.perks.find((perk) => perk.name === suscribtion_enum_1.SubscriptionPerksEnum.product);
    if (!productPerk) {
        throw new error_1.BadRequestError("Your subscription does not include product creation.");
    }
    if (productPerk.used >= productPerk.limit) {
        throw new error_1.BadRequestError("Product creation limit reached for your subscription.");
    }
    const data = await productService.createProduct(userId, payload);
    // increment usage
    productPerk.used += 1;
    await subscription.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.updateProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const updates = req.body;
    const files = req.files;
    const product = await productService.fetchProductById(productId);
    if (String(product?.userId) != String(userId)) {
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
    await product.save();
    const data = await productService.fetchProductById(productId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.getSingleProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { productId } = req.params;
    const { userId } = req.query;
    const product = await productService.fetchProductByIdWithDetails(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    let liked = false;
    let isCompared = false;
    if (userId) {
        const likedProduct = await productService.ifLikedProduct(productId, userId);
        liked = !!likedProduct;
        const user = await userService.findUserById(userId);
        if (user) {
            isCompared = user.comparedProducts.some((id) => id.toString() === productId);
        }
    }
    const reviewAggregation = await reviewService.fetchReviewForProduct(productId, 1, 4);
    const review = reviewAggregation[0] || {
        averageRating: 0,
        numberOfRatings: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
    };
    const data = {
        product,
        liked,
        isCompared,
        averageRating: review.averageRating || 0,
        numberOfRatings: review.numberOfRatings || 0,
        ratingDistribution: review.ratingDistribution,
        reviewsData: review.reviews || [],
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.getAllProductsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.query.userId ? req.query.userId : null;
    const products = await productService.fetchAllProducts(req.query);
    const data = products;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.deleteProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = await productService.fetchProductById(productId);
    if (String(product?.userId) !== String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    await productService.deleteProduct(productId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Product deleted successfully!");
});
exports.deleteProductImageController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId, imageId } = req.params;
    const product = await productService.fetchProductById(productId);
    if (String(product?.userId) !== String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    // const imageIndex = product.images?.findIndex(
    //     (image: { _id: any }) => image._id.toString() === imageId
    // );
    // if (imageIndex === -1) {
    //     throw new NotFoundError("Image not found");
    // }
    // product.images?.splice(imageIndex, 1);
    await product.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Image deleted successfully!");
});
exports.getUserProductsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const products = await productService.fetchUserProducts(userId, Number(page), Number(limit));
    const data = products;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.likeProductsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = await productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    ;
    const existingLike = await productService.ifLikedProduct(productId, userId);
    if (existingLike) {
        throw new error_1.BadRequestError("Product previously liked!");
    }
    ;
    await productService.createProductLike({
        product: productId,
        user: userId
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Liked successfully");
});
exports.fetchAllLikedProductsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const data = await productService.fetchLikedProducts(userId, page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.unlikeProductsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = await productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    await productService.unlikeProduct(productId, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Unliked successfully");
});
exports.reviewProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId, rating, comment } = req.body;
    const product = await productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    if (String(product.userId) == String(userId)) {
        throw new error_1.BadRequestError("You cannot review your own product!");
    }
    const isReviewed = await reviewService.isUserReviewed(productId, userId);
    if (isReviewed) {
        throw new error_1.BadRequestError("You have previously reviewed this product!");
    }
    const payload = {
        productId,
        userId,
        rating,
        comment
    };
    const data = await reviewService.addReview(payload);
    // product.reviews?.push(String(data._id));
    await product.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.addDiscountToProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const { discount } = req.body;
    const product = await productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("Product not found!");
    }
    if (String(product.userId) !== String(userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    product.discountedPrice = discount;
    product.isDiscounted = true;
    await product.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Discount added successfully!");
});
exports.fetchOtherProductByUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const data = await productService.otherProductsByUser(userId, page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSimilarProductByUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, userId } = req.query;
    const data = await productService.fetchSimilarProducts(productId, limit, page, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchProductReviewsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy } = req.query;
    const data = await productService.fetchProductReviews(productId, Number(page), Number(limit), sortBy);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.compareProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const product = await productService.fetchProductById(productId);
    if (!product) {
        throw new error_1.NotFoundError("No product found!");
    }
    ;
    const user = await userService.findUserById(userId);
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
    await user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: "Compared products updated successfully",
        comparedProducts: user.comparedProducts,
    });
});
exports.fetchAllComparedProductsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const user = await userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    ;
    const products = await productService.fetchAllComparedProducts(user.comparedProducts);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, products);
});
exports.getProductReviewsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { productId } = req.params;
    const { page = "1", limit = "4", search } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const reviewAggregation = await reviewService.fetchReviewForProduct(String(productId), pageNum, limitNum);
    const review = reviewAggregation[0] || {
        averageRating: 0,
        numberOfRatings: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
    };
    const data = {
        averageRating: review.averageRating || 0,
        numberOfRatings: review.numberOfRatings || 0,
        ratingDistribution: review.ratingDistribution,
        reviews: review.reviews || [],
        pagination: {
            page: pageNum,
            limit: limitNum,
            hasMore: review.reviews?.length === limitNum,
        },
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
