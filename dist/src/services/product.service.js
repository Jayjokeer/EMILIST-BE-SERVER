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
exports.fetchSimilarProducts = exports.otherProductsByUser = exports.fetchAllProductsAdmin = exports.fetchAllUserProductsAdmin = exports.fetchAllProductsForAdmin = exports.fetchReviewForProduct = exports.unlikeProduct = exports.fetchLikedProducts = exports.createProductLike = exports.ifLikedProduct = exports.fetchUserProducts = exports.deleteProduct = exports.fetchAllProducts = exports.fetchProductByIdWithDetails = exports.fetchProductById = exports.createProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productLike_model_1 = __importDefault(require("../models/productLike.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const error_1 = require("../errors/error");
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
const fetchAllProducts = (page, limit, userId, filters, search) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.priceRange) {
        query.price = {
            $gte: filters.priceRange[0],
            $lte: filters.priceRange[1],
        };
    }
    if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
    }
    if (search) {
        query.$or = [];
        const productFields = ['name', 'description', 'location', 'name', 'category', 'subCategory', 'storeName', 'brand'];
        productFields.forEach(field => {
            query.$or.push({ [field]: { $regex: search, $options: 'i' } });
        });
    }
    const totalProducts = yield product_model_1.default.countDocuments(query);
    const products = yield product_model_1.default.find(query)
        .skip(skip)
        .limit(limit)
        .populate({
        path: 'userId',
        select: 'fullName email userName profileImage level uniqueId isPrimeMember',
        match: filters.isPrimeMember !== undefined ? { isPrimeMember: filters.isPrimeMember } : {},
    })
        .lean();
    const filteredProducts = products.filter((product) => product.userId !== null);
    const productIds = filteredProducts.map((product) => product._id);
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
    const reviewMap = reviews.reduce((map, review) => {
        map[review._id.toString()] = {
            averageRating: review.averageRating || 0,
            numberOfRatings: review.numberOfRatings || 0,
        };
        return map;
    }, {});
    const enhancedProducts = filteredProducts
        .map((product) => {
        var _a, _b;
        return (Object.assign(Object.assign({}, product), { averageRating: ((_a = reviewMap[product._id.toString()]) === null || _a === void 0 ? void 0 : _a.averageRating) || 0, numberOfRatings: ((_b = reviewMap[product._id.toString()]) === null || _b === void 0 ? void 0 : _b.numberOfRatings) || 0 }));
    })
        .filter((product) => {
        if (filters.minRating && product.averageRating < filters.minRating)
            return false;
        if (filters.minReviews && product.numberOfRatings < filters.minReviews)
            return false;
        return true;
    });
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
const fetchAllProductsForAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.countDocuments();
});
exports.fetchAllProductsForAdmin = fetchAllProductsForAdmin;
const fetchAllUserProductsAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.find({ userId });
});
exports.fetchAllUserProductsAdmin = fetchAllUserProductsAdmin;
const fetchAllProductsAdmin = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const materials = yield product_model_1.default.find().populate('userId', 'fullName').skip(skip).limit(limit);
    const totalMaterials = yield product_model_1.default.countDocuments();
    return { materials, totalMaterials };
});
exports.fetchAllProductsAdmin = fetchAllProductsAdmin;
const otherProductsByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating');
});
exports.otherProductsByUser = otherProductsByUser;
const fetchSimilarProducts = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = 10;
    const targetProduct = yield product_model_1.default.findById(productId);
    if (!targetProduct) {
        throw new error_1.NotFoundError("Product not found!");
    }
    const query = {
        _id: { $ne: productId },
    };
    if (targetProduct.location || targetProduct.category || targetProduct.subCategory || targetProduct.brand || targetProduct.name) {
        query.$or = [
            { location: targetProduct.location },
            { category: targetProduct.category },
            { subCategory: targetProduct.subCategory },
            { brand: targetProduct.brand },
            { name: targetProduct.name },
        ];
    }
    ;
    const similarProducts = yield product_model_1.default.find(query)
        .limit(Number(limit))
        .populate('reviews', 'rating');
    const enhancedProducts = yield Promise.all(similarProducts.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const totalReviews = product.reviews.length;
        const averageRating = totalReviews > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return Object.assign(Object.assign({}, product.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
    })));
    return enhancedProducts;
});
exports.fetchSimilarProducts = fetchSimilarProducts;
