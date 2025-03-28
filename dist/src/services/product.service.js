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
exports.fetchAllCategories = exports.fetchSingleCategory = exports.deleteCategory = exports.createCategory = exports.fetchAllLikedProducts = exports.fetchAllComparedProducts = exports.fetchProductReviews = exports.fetchSimilarProducts = exports.otherProductsByUser = exports.fetchAllProductsAdmin = exports.fetchAllUserProductsAdmin = exports.fetchAllProductsForAdmin = exports.fetchReviewForProduct = exports.unlikeProduct = exports.fetchLikedProducts = exports.createProductLike = exports.ifLikedProduct = exports.fetchUserProducts = exports.deleteProduct = exports.fetchAllProducts = exports.fetchProductByIdWithDetails = exports.fetchProductById = exports.createProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productLike_model_1 = __importDefault(require("../models/productLike.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const error_1 = require("../errors/error");
const users_model_1 = __importDefault(require("../models/users.model"));
const categories_model_1 = __importDefault(require("../models/categories.model"));
const createProduct = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.create(data);
});
exports.createProduct = createProduct;
const fetchProductById = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.findById(productId);
});
exports.fetchProductById = fetchProductById;
const fetchProductByIdWithDetails = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.findById(productId)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId')
        .populate('reviews', 'rating');
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
        .sort({ createdAt: -1 })
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
        const user = yield users_model_1.default.findById(userId);
        const comparedProductIds = (user === null || user === void 0 ? void 0 : user.comparedProducts.map((id) => id.toString())) || [];
        productsWithDetails = enhancedProducts.map((product) => (Object.assign(Object.assign({}, product), { liked: likedProductIds.includes(product._id.toString()), isCompared: comparedProductIds.includes(product._id.toString()) })));
    }
    else {
        productsWithDetails = enhancedProducts.map((product) => (Object.assign(Object.assign({}, product), { liked: false, isCompared: false })));
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
    const totalProducts = yield product_model_1.default.countDocuments({ userId: userId });
    const products = yield product_model_1.default.find({ userId: userId })
        .skip(skip)
        .limit(limit)
        .populate('reviews', 'rating');
    const enhancedProducts = yield Promise.all(products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const totalReviews = product.reviews.length;
        const averageRating = totalReviews > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return Object.assign(Object.assign({}, product.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
    })));
    return {
        products: enhancedProducts,
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
const fetchAllProductsAdmin = (page, limit, search) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;
    let query = {};
    if (search) {
        query = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { subCategory: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { storeName: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
            ]
        };
    }
    const [materials, totalMaterials] = yield Promise.all([
        product_model_1.default.find(query)
            .populate('userId', 'fullName userName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        product_model_1.default.countDocuments(query)
    ]);
    return {
        materials,
        totalMaterials,
    };
});
exports.fetchAllProductsAdmin = fetchAllProductsAdmin;
const otherProductsByUser = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const products = yield product_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating')
        .skip(skip)
        .populate({
        path: 'userId',
        select: 'fullName email userName profileImage level uniqueId isPrimeMember',
    }).lean();
    const likedProducts = yield productLike_model_1.default.find({ user: userId }).select('product').lean();
    const likedProductIds = likedProducts.map((like) => like.product.toString());
    const user = yield users_model_1.default.findById(userId);
    const comparedProductIds = (user === null || user === void 0 ? void 0 : user.comparedProducts.map((id) => id.toString())) || [];
    const productsWithDetails = products.map((product) => (Object.assign(Object.assign({}, product), { liked: likedProductIds.includes(product._id.toString()), isCompared: comparedProductIds.includes(product._id.toString()) })));
    const totalProducts = productsWithDetails.length;
    return {
        products: productsWithDetails,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        limit,
        totalProducts,
    };
});
exports.otherProductsByUser = otherProductsByUser;
const fetchSimilarProducts = (productId, limit, page, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
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
        .skip(skip)
        .populate('reviews', 'rating')
        .populate({
        path: 'userId',
        select: 'fullName email userName profileImage level uniqueId isPrimeMember',
    });
    const enhancedProducts = yield Promise.all(similarProducts.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const totalReviews = product.reviews.length;
        const averageRating = totalReviews > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return Object.assign(Object.assign({}, product.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
    })));
    let productsWithDetails;
    if (userId) {
        const likedProducts = yield productLike_model_1.default.find({ user: userId }).select('product').lean();
        const likedProductIds = likedProducts.map((like) => like.product.toString());
        const user = yield users_model_1.default.findById(userId);
        const comparedProductIds = (user === null || user === void 0 ? void 0 : user.comparedProducts.map((id) => id.toString())) || [];
        productsWithDetails = enhancedProducts.map((product) => (Object.assign(Object.assign({}, product), { liked: likedProductIds.includes(product._id.toString()), isCompared: comparedProductIds.includes(product._id.toString()) })));
    }
    else {
        productsWithDetails = enhancedProducts.map((product) => (Object.assign(Object.assign({}, product), { liked: false, isCompared: false })));
    }
    const totalProducts = productsWithDetails.length;
    return {
        products: productsWithDetails,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        limit,
        totalProducts,
    };
});
exports.fetchSimilarProducts = fetchSimilarProducts;
const fetchProductReviews = (productId_1, page_1, limit_1, ...args_1) => __awaiter(void 0, [productId_1, page_1, limit_1, ...args_1], void 0, function* (productId, page, limit, sortBy = 'newest') {
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new error_1.NotFoundError('Material not found!');
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortCriteria = sortBy === 'mostRelevant' ? { helpfulCount: -1, createdAt: -1 } : { createdAt: -1 };
    const reviews = yield review_model_1.default.find({ productId })
        .skip(skip)
        .limit(Number(limit))
        .sort(sortCriteria)
        .populate('userId', 'profileImage fullName userName uniqueId gender level')
        .lean();
    const allReviews = yield review_model_1.default.find({ productId }).lean();
    const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
        acc[star] = allReviews.filter((review) => review.rating === star).length;
        return acc;
    }, {});
    const totalRatings = allReviews.length;
    const averageRating = totalRatings > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings
        : 0;
    const data = {
        averageRating: parseFloat(averageRating.toFixed(2)),
        numberOfRatings: totalRatings,
        starCounts,
        reviews,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRatings / Number(limit)),
    };
    return data;
});
exports.fetchProductReviews = fetchProductReviews;
const fetchAllComparedProducts = (productIds) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield product_model_1.default.find({ _id: { $in: productIds } })
        .populate('userId', 'fullName email userName uniqueId profileImage level gender')
        .populate('reviews', 'rating').lean();
    const enhancedProducts = yield Promise.all(products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const reviews = product.reviews || [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return Object.assign(Object.assign({}, product), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
    })));
    return {
        enhancedProducts
    };
});
exports.fetchAllComparedProducts = fetchAllComparedProducts;
const fetchAllLikedProducts = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const likedProducts = yield productLike_model_1.default.countDocuments({ user: userId });
    return {
        totalProductsLikes: likedProducts,
    };
});
exports.fetchAllLikedProducts = fetchAllLikedProducts;
const createCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield categories_model_1.default.create(payload);
});
exports.createCategory = createCategory;
const deleteCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield categories_model_1.default.findByIdAndDelete(id);
});
exports.deleteCategory = deleteCategory;
const fetchSingleCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield categories_model_1.default.findById(id);
});
exports.fetchSingleCategory = fetchSingleCategory;
const fetchAllCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield categories_model_1.default.find({ isActive: true });
});
exports.fetchAllCategories = fetchAllCategories;
