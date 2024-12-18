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
exports.fetchReviewForProduct = exports.unlikeProduct = exports.fetchLikedProducts = exports.createProductLike = exports.ifLikedProduct = exports.fetchUserProducts = exports.deleteProduct = exports.fetchAllProducts = exports.fetchProductByIdWithDetails = exports.fetchProductById = exports.createProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productLike_model_1 = __importDefault(require("../models/productLike.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const createProduct = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.create(data);
});
exports.createProduct = createProduct;
const fetchProductById = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.findById(productId);
});
exports.fetchProductById = fetchProductById;
const fetchProductByIdWithDetails = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.findById(productId).populate('userId', 'fullName email userName profileImage level _id uniqueId');
});
exports.fetchProductByIdWithDetails = fetchProductByIdWithDetails;
const fetchAllProducts = (page, limit, userId, filters) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    // Base query for Product model
    const query = {};
    // Apply price range filter
    if (filters.priceRange) {
        query.price = {
            $gte: filters.priceRange[0],
            $lte: filters.priceRange[1],
        };
    }
    // Prime member filter will be applied during population
    // Find total products for pagination
    const totalProducts = yield product_model_1.default.countDocuments(query);
    // Fetch products with filters and populate user data
    const products = yield product_model_1.default.find(query)
        .skip(skip)
        .limit(limit)
        .populate({
        path: 'userId',
        select: 'fullName email userName profileImage level uniqueId isPrimeMember',
        match: filters.isPrimeMember !== undefined ? { isPrimeMember: filters.isPrimeMember } : {},
    })
        .lean();
    // Filter out products whose users don't match the prime member criteria
    const filteredProducts = products.filter((product) => product.userId !== null);
    // Collect product IDs for review aggregation
    const productIds = filteredProducts.map((product) => product._id);
    // Fetch review metrics using aggregation
    const reviews = yield review_model_1.default.aggregate([
        {
            $match: { productId: { $in: productIds } },
        },
        {
            $group: {
                _id: '$productId',
                averageRating: { $avg: '$rating' },
                numberOfRatings: { $sum: 1 },
            },
        },
    ]);
    // Map review data for easy lookup
    const reviewMap = reviews.reduce((map, review) => {
        map[review._id.toString()] = {
            averageRating: review.averageRating || 0,
            numberOfRatings: review.numberOfRatings || 0,
        };
        return map;
    }, {});
    // Enhance products with review data and apply additional filters
    const enhancedProducts = filteredProducts
        .map((product) => {
        var _a, _b;
        return (Object.assign(Object.assign({}, product), { averageRating: ((_a = reviewMap[product._id.toString()]) === null || _a === void 0 ? void 0 : _a.averageRating) || 0, numberOfRatings: ((_b = reviewMap[product._id.toString()]) === null || _b === void 0 ? void 0 : _b.numberOfRatings) || 0 }));
    })
        .filter((product) => {
        // Apply rating and review filters
        if (filters.minRating && product.averageRating < filters.minRating)
            return false;
        if (filters.minReviews && product.numberOfRatings < filters.minReviews)
            return false;
        return true;
    });
    // Check liked status for each product if userId is provided
    let productsWithDetails;
    if (userId) {
        const likedProducts = yield productLike_model_1.default.find({ user: userId }).select('product').lean();
        const likedProductIds = likedProducts.map((like) => like.product.toString());
        productsWithDetails = enhancedProducts.map((product) => (Object.assign(Object.assign({}, product), { liked: likedProductIds.includes(product._id.toString()) })));
    }
    else {
        productsWithDetails = enhancedProducts.map((product) => (Object.assign(Object.assign({}, product), { liked: false })));
    }
    return {
        products: productsWithDetails,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts: productsWithDetails.length,
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
const ifLikedProduct = (productId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield productLike_model_1.default.findOne({ product: productId, user: userId });
});
exports.ifLikedProduct = ifLikedProduct;
const createProductLike = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield productLike_model_1.default.create(data);
});
exports.createProductLike = createProductLike;
const fetchLikedProducts = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const likedProducts = yield productLike_model_1.default.find({ user: userId }).select('product').lean();
    const likedProductsId = likedProducts.map((like) => like.product);
    const products = yield product_model_1.default.find({ _id: { $in: likedProductsId } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    const totalLikedProducts = likedProductsId.length;
    return {
        products,
        totalPages: Math.ceil(totalLikedProducts / limit),
        currentPage: page,
        totalLikedProducts,
    };
});
exports.fetchLikedProducts = fetchLikedProducts;
const unlikeProduct = (productId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield productLike_model_1.default.findOneAndDelete({ user: userId, product: productId });
});
exports.unlikeProduct = unlikeProduct;
const fetchReviewForProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid productId");
    }
    const objectId = new mongoose_1.default.Types.ObjectId(productId);
    const result = yield review_model_1.default.aggregate([
        {
            $match: { productId: objectId },
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userInfo",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            fullName: 1,
                            profileImage: 1,
                            email: 1,
                            userName: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $group: {
                _id: "$productId",
                averageRating: { $avg: "$rating" },
                numberOfRatings: { $sum: 1 },
                reviews: {
                    $push: {
                        rating: "$rating",
                        comment: "$comment",
                        user: "$userInfo",
                    },
                },
            },
        },
    ]);
    if (result.length === 0) {
        return {
            averageRating: 0,
            numberOfRatings: 0,
            reviews: [],
        };
    }
    return result[0];
});
exports.fetchReviewForProduct = fetchReviewForProduct;
