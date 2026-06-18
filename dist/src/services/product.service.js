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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllCategories = exports.fetchSingleCategory = exports.deleteCategory = exports.createCategory = exports.fetchAllLikedProducts = exports.fetchAllComparedProducts = exports.fetchProductReviews = exports.fetchSimilarProducts = exports.otherProductsByUser = exports.fetchAllProductsAdmin = exports.fetchAllUserProductsAdmin = exports.fetchAllProductsForAdmin = exports.fetchReviewForProduct = exports.unlikeProduct = exports.fetchLikedProducts = exports.createProductLike = exports.ifLikedProduct = exports.fetchUserProducts = exports.deleteProduct = exports.fetchAllProducts = exports.fetchProductByIdWithDetails = exports.fetchProductById = exports.createProduct = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productLike_model_1 = __importDefault(require("../models/productLike.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const error_1 = require("../errors/error");
const users_model_1 = __importDefault(require("../models/users.model"));
const categories_model_1 = __importDefault(require("../models/categories.model"));
const slugify_1 = __importDefault(require("slugify"));
const createProduct = async (userId, data) => {
    const payload = { ...data };
    payload.userId = new mongoose_1.Types.ObjectId(userId);
    if (typeof payload.category === "string") {
        const categoryName = payload.category.trim();
        let category = await categories_model_1.default.findOne({
            name: payload.category,
        });
        if (!category) {
            category = await categories_model_1.default.create({
                name: categoryName,
                slug: (0, slugify_1.default)(categoryName, {
                    lower: true,
                    strict: true,
                }),
                isActive: true,
            });
        }
        payload.category = category._id;
    }
    payload.status = "pending";
    payload.isDeleted = false;
    payload.clicks = {
        users: [],
        clickCount: 0,
    };
    if (payload.images) {
        payload.images = payload.images.map((img) => ({
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary ?? false,
        }));
    }
    return await product_model_1.default.create(payload);
};
exports.createProduct = createProduct;
const fetchProductById = async (productId) => {
    return await product_model_1.default.findById(productId);
};
exports.fetchProductById = fetchProductById;
const fetchProductByIdWithDetails = async (productId) => {
    return await product_model_1.default.findById(productId)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId')
        .populate('reviews', 'rating');
};
exports.fetchProductByIdWithDetails = fetchProductByIdWithDetails;
const fetchAllProducts = async (page = 1, limit = 10, userId, filters = {}, search) => {
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const pageLimit = Number(limit) > 0 ? Number(limit) : 10;
    const skip = (currentPage - 1) * pageLimit;
    const query = {};
    if (filters.priceRange) {
        query.price = {
            $gte: filters.priceRange[0],
            $lte: filters.priceRange[1],
        };
    }
    if (filters.currency) {
        query.currency = filters.currency;
    }
    if (filters.location) {
        query.location = { $regex: filters.location, $options: "i" };
    }
    if (search) {
        const productFields = [
            "name",
            "description",
            "location",
            "category",
            "subCategory",
            "storeName",
            "brand",
        ];
        const sentenceRegex = new RegExp(search, "i");
        const words = search.split(" ").filter((w) => w.trim().length > 0);
        const wordRegexes = words.map((word) => new RegExp(word, "i"));
        query.$or = [];
        productFields.forEach((field) => {
            query.$or.push({ [field]: { $regex: sentenceRegex } });
        });
        wordRegexes.forEach((regex) => {
            productFields.forEach((field) => {
                query.$or.push({ [field]: { $regex: regex } });
            });
        });
    }
    const totalProducts = await product_model_1.default.countDocuments(query);
    const products = await product_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate({
        path: "userId",
        select: "fullName email userName profileImage level uniqueId isPrimeMember",
        match: filters.isPrimeMember !== undefined
            ? { isPrimeMember: filters.isPrimeMember }
            : {},
    })
        .lean();
    const filteredProducts = products.filter((product) => product.userId !== null);
    const productIds = filteredProducts.map((product) => product._id);
    const reviews = await review_model_1.default.aggregate([
        { $match: { productId: { $in: productIds } } },
        {
            $group: {
                _id: "$productId",
                averageRating: { $avg: "$rating" },
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
        .map((product) => ({
        ...product,
        averageRating: reviewMap[product._id.toString()]?.averageRating || 0,
        numberOfRatings: reviewMap[product._id.toString()]?.numberOfRatings || 0,
    }))
        .filter((product) => {
        if (filters.minRating && product.averageRating < filters.minRating)
            return false;
        if (filters.minReviews && product.numberOfRatings < filters.minReviews)
            return false;
        return true;
    });
    let productsWithDetails;
    if (userId) {
        const likedProducts = await productLike_model_1.default.find({ user: userId })
            .select("product")
            .lean();
        const likedProductIds = likedProducts.map((like) => like.product.toString());
        const user = await users_model_1.default.findById(userId);
        const comparedProductIds = user?.comparedProducts.map((id) => id.toString()) || [];
        productsWithDetails = enhancedProducts.map((product) => ({
            ...product,
            liked: likedProductIds.includes(product._id.toString()),
            isCompared: comparedProductIds.includes(product._id.toString()),
        }));
    }
    else {
        productsWithDetails = enhancedProducts.map((product) => ({
            ...product,
            liked: false,
            isCompared: false,
        }));
    }
    return {
        products: productsWithDetails,
        totalPages: Math.ceil(totalProducts / pageLimit),
        currentPage,
        totalProducts: productsWithDetails.length,
    };
};
exports.fetchAllProducts = fetchAllProducts;
const deleteProduct = async (productId) => {
    return await product_model_1.default.findByIdAndDelete(productId);
};
exports.deleteProduct = deleteProduct;
const fetchUserProducts = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    const totalProducts = await product_model_1.default.countDocuments({ userId: userId });
    const products = await product_model_1.default.find({ userId: userId })
        .skip(skip)
        .limit(limit)
        .populate('reviews', 'rating');
    const enhancedProducts = await Promise.all(products.map(async (product) => {
        const totalReviews = product.reviews.length;
        const averageRating = totalReviews > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return {
            ...product.toObject(),
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
        };
    }));
    return {
        products: enhancedProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts
    };
};
exports.fetchUserProducts = fetchUserProducts;
const ifLikedProduct = async (productId, userId) => {
    return await productLike_model_1.default.findOne({ product: productId, user: userId });
};
exports.ifLikedProduct = ifLikedProduct;
const createProductLike = async (data) => {
    return await productLike_model_1.default.create(data);
};
exports.createProductLike = createProductLike;
const fetchLikedProducts = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    const likedProducts = await productLike_model_1.default.find({ user: userId }).select('product').lean();
    const likedProductsId = likedProducts.map((like) => like.product);
    const products = await product_model_1.default.find({ _id: { $in: likedProductsId } })
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
};
exports.fetchLikedProducts = fetchLikedProducts;
const unlikeProduct = async (productId, userId) => {
    return await productLike_model_1.default.findOneAndDelete({ user: userId, product: productId });
};
exports.unlikeProduct = unlikeProduct;
const fetchReviewForProduct = async (productId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid productId");
    }
    const objectId = new mongoose_1.default.Types.ObjectId(productId);
    const result = await review_model_1.default.aggregate([
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
};
exports.fetchReviewForProduct = fetchReviewForProduct;
const fetchAllProductsForAdmin = async () => {
    return await product_model_1.default.countDocuments();
};
exports.fetchAllProductsForAdmin = fetchAllProductsForAdmin;
const fetchAllUserProductsAdmin = async (userId) => {
    return await product_model_1.default.find({ userId });
};
exports.fetchAllUserProductsAdmin = fetchAllUserProductsAdmin;
const fetchAllProductsAdmin = async (page, limit, search) => {
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
    const [materials, totalMaterials] = await Promise.all([
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
};
exports.fetchAllProductsAdmin = fetchAllProductsAdmin;
const otherProductsByUser = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    const products = await product_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating')
        .skip(skip)
        .populate({
        path: 'userId',
        select: 'fullName email userName profileImage level uniqueId isPrimeMember',
    }).lean();
    const likedProducts = await productLike_model_1.default.find({ user: userId }).select('product').lean();
    const likedProductIds = likedProducts.map((like) => like.product.toString());
    const user = await users_model_1.default.findById(userId);
    const comparedProductIds = user?.comparedProducts.map((id) => id.toString()) || [];
    const productsWithDetails = products.map((product) => ({
        ...product,
        liked: likedProductIds.includes(product._id.toString()),
        isCompared: comparedProductIds.includes(product._id.toString()),
    }));
    const totalProducts = productsWithDetails.length;
    return {
        products: productsWithDetails,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        limit,
        totalProducts,
    };
};
exports.otherProductsByUser = otherProductsByUser;
const fetchSimilarProducts = async (productId, limit, page, userId) => {
    const skip = (page - 1) * limit;
    const targetProduct = await product_model_1.default.findById(productId);
    if (!targetProduct) {
        throw new error_1.NotFoundError("Product not found!");
    }
    const query = {
        _id: { $ne: productId },
    };
    // if (targetProduct.location || targetProduct.category || targetProduct.subCategory || targetProduct.brand || targetProduct.name) {
    //   query.$or = [
    //     { location : targetProduct.location },
    //     { category: targetProduct.category},
    //     { subCategory: targetProduct.subCategory},
    //     { brand: targetProduct.brand},
    //     { name: targetProduct.name},
    //   ];
    // };
    const similarProducts = await product_model_1.default.find(query)
        .limit(Number(limit))
        .skip(skip)
        .populate('reviews', 'rating')
        .populate({
        path: 'userId',
        select: 'fullName email userName profileImage level uniqueId isPrimeMember',
    });
    const enhancedProducts = await Promise.all(similarProducts.map(async (product) => {
        const totalReviews = product.reviews.length;
        const averageRating = totalReviews > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return {
            ...product.toObject(),
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
        };
    }));
    let productsWithDetails;
    if (userId) {
        const likedProducts = await productLike_model_1.default.find({ user: userId }).select('product').lean();
        const likedProductIds = likedProducts.map((like) => like.product.toString());
        const user = await users_model_1.default.findById(userId);
        const comparedProductIds = user?.comparedProducts.map((id) => id.toString()) || [];
        productsWithDetails = enhancedProducts.map((product) => ({
            ...product,
            liked: likedProductIds.includes(product._id.toString()),
            isCompared: comparedProductIds.includes(product._id.toString()),
        }));
    }
    else {
        productsWithDetails = enhancedProducts.map((product) => ({
            ...product,
            liked: false,
            isCompared: false,
        }));
    }
    const totalProducts = productsWithDetails.length;
    return {
        products: productsWithDetails,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        limit,
        totalProducts,
    };
};
exports.fetchSimilarProducts = fetchSimilarProducts;
const fetchProductReviews = async (productId, page, limit, sortBy = 'newest') => {
    const product = await product_model_1.default.findById(productId);
    if (!product) {
        throw new error_1.NotFoundError('Material not found!');
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortCriteria = sortBy === 'mostRelevant' ? { helpfulCount: -1, createdAt: -1 } : { createdAt: -1 };
    const reviews = await review_model_1.default.find({ productId })
        .skip(skip)
        .limit(Number(limit))
        .sort(sortCriteria)
        .populate('userId', 'profileImage fullName userName uniqueId gender level')
        .lean();
    const allReviews = await review_model_1.default.find({ productId }).lean();
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
};
exports.fetchProductReviews = fetchProductReviews;
const fetchAllComparedProducts = async (productIds) => {
    const products = await product_model_1.default.find({ _id: { $in: productIds } })
        .populate('userId', 'fullName email userName uniqueId profileImage level gender')
        .populate('reviews', 'rating').lean();
    const enhancedProducts = await Promise.all(products.map(async (product) => {
        const reviews = product.reviews || [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return {
            ...product,
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
        };
    }));
    return {
        enhancedProducts
    };
};
exports.fetchAllComparedProducts = fetchAllComparedProducts;
const fetchAllLikedProducts = async (userId) => {
    const likedProducts = await productLike_model_1.default.countDocuments({ user: userId });
    return {
        totalProductsLikes: likedProducts,
    };
};
exports.fetchAllLikedProducts = fetchAllLikedProducts;
const createCategory = async (payload) => {
    return await categories_model_1.default.create(payload);
};
exports.createCategory = createCategory;
const deleteCategory = async (id) => {
    return await categories_model_1.default.findByIdAndDelete(id);
};
exports.deleteCategory = deleteCategory;
const fetchSingleCategory = async (id) => {
    return await categories_model_1.default.findById(id);
};
exports.fetchSingleCategory = fetchSingleCategory;
const fetchAllCategories = async () => {
    return await categories_model_1.default.find({ isActive: true });
};
exports.fetchAllCategories = fetchAllCategories;
