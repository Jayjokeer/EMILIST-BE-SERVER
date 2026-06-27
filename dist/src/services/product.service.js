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
    return await product_model_1.default.findOne({ _id: productId, isDeleted: false })
        .populate('userId', 'fullName email userName profileImage level _id uniqueId')
        .populate('category', 'name slug')
        .lean();
};
exports.fetchProductByIdWithDetails = fetchProductByIdWithDetails;
const fetchAllProducts = async (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.max(parseInt(query.limit) || 20, 1);
    const skip = (page - 1) * limit;
    const { search, category, brand, minPrice, maxPrice, deliveryState, deliveryLga, minRating, maxDeliveryTime, isDiscounted, inStock, sort = "newest", } = query;
    const match = {
        status: "active",
        isDeleted: false,
    };
    if (category &&
        mongoose_1.default.Types.ObjectId.isValid(category)) {
        match.category = new mongoose_1.default.Types.ObjectId(category);
    }
    if (brand) {
        match.brand = {
            $regex: brand,
            $options: "i",
        };
    }
    if (search) {
        match.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                description: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                merchantName: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                storeName: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                brand: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }
    if (minPrice || maxPrice) {
        match.price = {};
        if (minPrice)
            match.price.$gte = Number(minPrice);
        if (maxPrice)
            match.price.$lte = Number(maxPrice);
    }
    if (isDiscounted !== undefined) {
        match.isDiscounted =
            isDiscounted === "true";
    }
    if (inStock === "true") {
        match.availableQuantity = {
            $gt: 0,
        };
    }
    if (deliveryState || deliveryLga) {
        match.deliveryLocations = {
            $elemMatch: {},
        };
        if (deliveryState) {
            match.deliveryLocations.$elemMatch.state =
                deliveryState;
        }
        if (deliveryLga) {
            match.deliveryLocations.$elemMatch.lga =
                deliveryLga;
        }
    }
    const sortMap = {
        newest: {
            createdAt: -1,
        },
        oldest: {
            createdAt: 1,
        },
        priceAsc: {
            price: 1,
        },
        priceDesc: {
            price: -1,
        },
        rating: {
            averageRating: -1,
        },
        deliveryTime: {
            deliveryTime: 1,
        },
    };
    const pipeline = [
        {
            $match: match,
        },
        /**
         * Category Lookup
         */
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category",
            },
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true,
            },
        },
        /**
         * Seller Lookup
         */
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "seller",
            },
        },
        {
            $unwind: {
                path: "$seller",
                preserveNullAndEmptyArrays: true,
            },
        },
        /**
         * Review Aggregation
         * (average rating + review count)
         */
        {
            $lookup: {
                from: "reviews",
                let: {
                    productId: "$_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$productId",
                                    "$$productId",
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            averageRating: {
                                $avg: "$rating",
                            },
                            reviewCount: {
                                $sum: 1,
                            },
                        },
                    },
                ],
                as: "ratingStats",
            },
        },
        /**
     * Compute Product Fields
     */
        {
            $addFields: {
                /**
                 * Average Rating
                 */
                averageRating: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$ratingStats.averageRating",
                                0,
                            ],
                        },
                        0,
                    ],
                },
                /**
                 * Total Reviews
                 */
                reviewCount: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$ratingStats.reviewCount",
                                0,
                            ],
                        },
                        0,
                    ],
                },
                /**
                 * Seller Full Name
                 */
                sellerName: {
                    $trim: {
                        input: {
                            $concat: [
                                {
                                    $ifNull: [
                                        "$seller.firstName",
                                        "",
                                    ],
                                },
                                " ",
                                {
                                    $ifNull: [
                                        "$seller.lastName",
                                        "",
                                    ],
                                },
                            ],
                        },
                    },
                },
                /**
                 * Seller Avatar
                 */
                sellerImage: {
                    $ifNull: [
                        "$seller.displayImage",
                        "",
                    ],
                },
                /**
                 * Seller Verification
                 */
                sellerVerified: {
                    $ifNull: [
                        "$seller.isVerified",
                        false,
                    ],
                },
                /**
                 * Prime Membership
                 */
                sellerPrimeMember: {
                    $ifNull: [
                        "$seller.isPrimeMember",
                        false,
                    ],
                },
                /**
                 * Seller Location
                 */
                sellerLocation: {
                    city: "$seller.city",
                    state: "$seller.state",
                    country: "$seller.country",
                },
                /**
                 * Date Posted
                 */
                datePosted: "$createdAt",
                /**
                 * Primary Product Image
                 */
                primaryImage: {
                    $let: {
                        vars: {
                            primary: {
                                $first: {
                                    $filter: {
                                        input: "$images",
                                        as: "image",
                                        cond: {
                                            $eq: [
                                                "$$image.isPrimary",
                                                true,
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        in: {
                            $ifNull: [
                                "$$primary.imageUrl",
                                {
                                    $arrayElemAt: [
                                        "$images.imageUrl",
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
                /**
                 * Effective Price
                 */
                finalPrice: {
                    $cond: [
                        "$isDiscounted",
                        "$discountedPrice",
                        "$price",
                    ],
                },
                /**
                 * Discount Percentage
                 */
                discountPercentage: {
                    $cond: [
                        {
                            $and: [
                                "$isDiscounted",
                                {
                                    $gt: [
                                        "$price",
                                        0,
                                    ],
                                },
                                {
                                    $ne: [
                                        "$discountedPrice",
                                        null,
                                    ],
                                },
                            ],
                        },
                        {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                {
                                                    $subtract: [
                                                        "$price",
                                                        "$discountedPrice",
                                                    ],
                                                },
                                                "$price",
                                            ],
                                        },
                                        100,
                                    ],
                                },
                                0,
                            ],
                        },
                        0,
                    ],
                },
                /**
                 * Product Availability
                 */
                availability: {
                    $cond: [
                        {
                            $gt: [
                                "$availableQuantity",
                                0,
                            ],
                        },
                        "In Stock",
                        "Out of Stock",
                    ],
                },
                /**
                 * Has Reviews
                 */
                hasReviews: {
                    $gt: [
                        "$reviewCount",
                        0,
                    ],
                },
                /**
                 * Has Discount
                 */
                hasDiscount: {
                    $eq: [
                        "$isDiscounted",
                        true,
                    ],
                },
                /**
                 * Total Images
                 */
                imageCount: {
                    $size: {
                        $ifNull: [
                            "$images",
                            [],
                        ],
                    },
                },
            },
        },
    ];
    if (minRating) {
        pipeline.push({
            $match: {
                averageRating: {
                    $gte: Number(minRating),
                },
            },
        });
    }
    /**
     * Delivery Time Filter
     *
     * NOTE:
     * This assumes you've added a deliveryTime field
     * to the Product schema.
     */
    if (maxDeliveryTime) {
        pipeline.push({
            $match: {
                deliveryTime: {
                    $lte: Number(maxDeliveryTime),
                },
            },
        });
    }
    /**
     * Sorting
     */
    pipeline.push({
        $sort: sortMap[sort] || sortMap.newest,
    });
    /**
     * Pagination
     */
    pipeline.push({
        $facet: {
            products: [
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
                /**
                 * Final API Response
                 */
                {
                    $project: {
                        _id: 0,
                        id: "$_id",
                        name: 1,
                        slug: 1,
                        description: 1,
                        brand: 1,
                        merchantName: 1,
                        storeName: 1,
                        /**
                         * Category
                         */
                        category: {
                            id: "$category._id",
                            name: {
                                $ifNull: [
                                    "$category.name",
                                    "$category.title",
                                ],
                            },
                        },
                        /**
                         * Images
                         */
                        image: "$primaryImage",
                        images: "$images",
                        imageCount: 1,
                        /**
                         * Seller
                         */
                        seller: {
                            id: "$seller._id",
                            name: "$sellerName",
                            image: "$sellerImage",
                            verified: "$sellerVerified",
                            isPrimeMember: "$sellerPrimeMember",
                            city: "$seller.city",
                            state: "$seller.state",
                            country: "$seller.country",
                        },
                        /**
                         * Pricing
                         */
                        price: 1,
                        discountedPrice: 1,
                        finalPrice: 1,
                        discountPercentage: 1,
                        currency: 1,
                        isDiscounted: 1,
                        /**
                         * Inventory
                         */
                        availableQuantity: 1,
                        quantityMetric: 1,
                        availability: 1,
                        /**
                         * Rating
                         */
                        averageRating: {
                            $round: [
                                "$averageRating",
                                1,
                            ],
                        },
                        reviewCount: 1,
                        hasReviews: 1,
                        /**
                         * Delivery
                         */
                        deliveryLocations: 1,
                        deliveryTime: 1,
                        /**
                         * Misc
                         */
                        hasDiscount: 1,
                        status: 1,
                        datePosted: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ],
            pagination: [
                {
                    $count: "total",
                },
            ],
        },
    });
    try {
        const [result] = await product_model_1.default.aggregate(pipeline);
        const products = result?.products ?? [];
        const total = result?.pagination?.[0]?.total ?? 0;
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            success: true,
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page < totalPages
                    ? page + 1
                    : null,
                previousPage: page > 1
                    ? page - 1
                    : null,
            },
        };
    }
    catch (error) {
        console.error("Fetch Products Error", error);
        throw error;
    }
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
const fetchSimilarProducts = async (productId, limit = 8) => {
    const currentProduct = await product_model_1.default.findById(productId).select("category subCategory brand price deliveryLocations");
    if (!currentProduct) {
        return [];
    }
    const matchStage = {
        _id: { $ne: new mongoose_1.default.Types.ObjectId(productId) },
        isDeleted: false,
        status: "active",
    };
    matchStage.category = currentProduct.category;
    const similarProducts = await product_model_1.default.aggregate([
        { $match: matchStage },
        // Score relevance: same subCategory and/or brand ranks higher
        {
            $addFields: {
                relevanceScore: {
                    $sum: [
                        {
                            $cond: [
                                { $eq: ["$subCategory", currentProduct.subCategory] },
                                2,
                                0,
                            ],
                        },
                        {
                            $cond: [{ $eq: ["$brand", currentProduct.brand] }, 1, 0],
                        },
                    ],
                },
                priceDiff: {
                    $abs: { $subtract: ["$price", currentProduct.price] },
                },
            },
        },
        { $sort: { relevanceScore: -1, priceDiff: 1, createdAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "reviews",
                localField: "reviews",
                foreignField: "_id",
                as: "reviewDocs",
            },
        },
        {
            $project: {
                name: 1,
                images: 1,
                price: 1,
                priceMetric: 1,
                currency: 1,
                availableQuantity: 1,
                quantityMetric: 1,
                merchantName: 1,
                deliveryLocations: 1,
                isDiscounted: 1,
                discountedPrice: 1,
                createdAt: 1,
                "user._id": 1,
                "user.fullName": 1,
                "user.profileImage": 1,
                averageRating: { $avg: "$reviewDocs.rating" },
                numberOfRatings: { $size: "$reviewDocs" },
            },
        },
    ]);
    if (similarProducts.length < 4 && currentProduct.brand) {
        const fallback = await product_model_1.default.find({
            _id: {
                $ne: productId,
                $nin: similarProducts.map((p) => p._id),
            },
            brand: currentProduct.brand,
            isDeleted: false,
            status: "active",
        })
            .limit(limit - similarProducts.length)
            .select("name images price priceMetric currency merchantName deliveryLocations")
            .lean();
        return [...similarProducts, ...fallback];
    }
    return similarProducts;
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
