import mongoose, { Types, PipelineStage } from "mongoose";
import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";
import ProductLike from "../models/productLike.model";
import ProductFlag from "../models/productFlag.model";
import Review from "../models/review.model";
import { BadRequestError, NotFoundError } from "../errors/error";
import User from "../models/users.model";
import Category from "../models/categories.model";
import slugify from "slugify";

export const createProduct = async (userId: string, data: IProduct) => {
  const payload: any = { ...data };

  payload.userId = new Types.ObjectId(userId);

  if (payload.name) {
    payload.slug = slugify(payload.name, {
      lower: true,
      strict: true,
    });
  }
  const isSlugExists = await Product.findOne({slug: payload.slug});
  if (isSlugExists){
    throw new BadRequestError('A material already exists with the name')
  }
  if (typeof payload.category === "string") {
    const categoryName = payload.category.trim();

    let category = await Category.findOne({
      name: payload.category,
    });

     if (!category) {
    category = await Category.create({
      name: categoryName,
      slug: slugify(categoryName, {
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
    payload.images = payload.images.map((img: any) => ({
      imageUrl: img.imageUrl,
      isPrimary: img.isPrimary ?? false,
      order: img.order ?? 0,
    }));
  }

  return await Product.create(payload);
};

export const fetchProductById = async (productId: any) =>{
    return await Product.findById(productId);
    
};
export const fetchProductByIdWithDetails = async (productId: string) => {
  return await Product.findOne({ _id: productId, isDeleted: false })
    .populate('userId', 'fullName email userName profileImage level _id uniqueId')
    .populate('category', 'name slug')
    .lean();
};

// ========================
// MARKETPLACE fetchAllProducts – FULL REBUILD
// ========================
export const fetchAllProducts = async (query: any) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || 20, 1);
  const skip = (page - 1) * limit;
 
  const {
    search,
    categories,
    brand,
    priceRanges, // e.g. "0-20000,21000-50000,500000-" (open-ended max uses trailing dash)
    minPrice, // still supported for direct/legacy min-max usage
    maxPrice,
    state,
    locations,
    deliveryTime, // now supports a single value OR array/comma-separated list
    merchantRating,
    verified,
    inStock,
    sortBy = "latest",
    userId,
  } = query;
 
  // ---- BASE MATCH ----
  const match: Record<string, any> = {
    status: "active",
    isDeleted: false,
  };
 
  // ---- SEARCH ----
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    match.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { merchantName: searchRegex },
      { brand: searchRegex },
    ];
  }
 
  // ---- CATEGORY FILTER (array) ----
  if (categories) {
    let catArray: string[] = [];
    if (Array.isArray(categories)) {
      catArray = categories;
    } else if (typeof categories === "string") {
      catArray = categories.split(",");
    }
 
    const validIds = catArray
      .map((c: string) => {
        try {
          return new mongoose.Types.ObjectId(c.trim());
        } catch {
          return null;
        }
      })
      .filter(Boolean);
 
    if (validIds.length > 0) {
      match.category = { $in: validIds };
    }
  }
 

  if (brand) {
    const brandArray = Array.isArray(brand) ? brand : String(brand).split(",");
    match.brand = {
      $in: brandArray.map((b: string) => new RegExp(`^${b.trim()}$`, "i")),
    };
  }
 

  let priceOrConditions: Record<string, any>[] = [];
 
  if (priceRanges) {
    const rangesArray = Array.isArray(priceRanges)
      ? priceRanges
      : String(priceRanges).split(",");
 
    priceOrConditions = rangesArray
      .map((range: string) => {
        const [rawMin, rawMax] = range.split("-").map((v) => v?.trim());
        const cond: Record<string, any> = {};
        if (rawMin) cond.$gte = Number(rawMin);
        if (rawMax) cond.$lte = Number(rawMax);
        return Object.keys(cond).length ? { price: cond } : null;
      })
      .filter(Boolean) as Record<string, any>[];
  }
 
  if (priceOrConditions.length > 0) {
    // Combine with any existing top-level $or (from search) using $and,
    // since $or is already claimed by the search filter above.
    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: priceOrConditions }];
      delete match.$or;
    } else {
      match.$or = priceOrConditions;
    }
  } else if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = Number(minPrice);
    if (maxPrice) match.price.$lte = Number(maxPrice);
  }
 
  // ---- IN-STOCK FILTER ----
  if (inStock === "true") {
    match.availableQuantity = { $gt: 0 };
  }
 
  // ---- BUILD PIPELINE ----
  const pipeline: PipelineStage[] = [
    { $match: match },
 
    // Category Lookup
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
 
    // Search by category name if search is provided (since $or above searches product fields only)
    ...(search && !categories
      ? [
          {
            $match: {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { merchantName: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
                { "category.name": { $regex: search, $options: "i" } },
              ],
            },
          } as PipelineStage,
        ]
      : []),
 
    // Seller Lookup
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
 
    // Seller verified filter
    ...(verified === "true"
      ? [{ $match: { "seller.isVerified": true } } as PipelineStage]
      : []),
 
    // Delivery location filter by state
    ...(state
      ? [
          {
            $match: {
              "deliveryLocations.state": { $regex: state, $options: "i" },
            },
          } as PipelineStage,
        ]
      : []),
 
    // Delivery location filter by area/lga (multiple)
    ...(locations
      ? [
          {
            $match: {
              "deliveryLocations.lga": {
                $in: (Array.isArray(locations) ? locations : [locations]).map(
                  (l: string) => new RegExp(l.trim(), "i")
                ),
              },
            },
          } as PipelineStage,
        ]
      : []),
 
    // Delivery time filter — now supports multiple chips selected together
    // (schema enum: immediately, 1_day, 2_3_days, 1_week, 1_2_weeks, 2_3_weeks, 1_month, 3_months)
    ...(deliveryTime
      ? [
          {
            $match: {
              deliveryTime: {
                $in: Array.isArray(deliveryTime)
                  ? deliveryTime
                  : String(deliveryTime).split(","),
              },
            },
          } as PipelineStage,
        ]
      : []),
 
    // Product-level Review Aggregation (for this product's own rating + count)
    {
      $lookup: {
        from: "reviews",
        let: { productId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ],
        as: "ratingStats",
      },
    },
 
    // ---- MERCHANT-LEVEL RATING ----
    // "Merchant Rating" in the filters panel is about the SELLER as a whole,
    // not this single product. Pull every active product this seller owns,
    // then aggregate review ratings across all of them.
    {
      $lookup: {
        from: "products",
        let: { sellerId: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userId", "$$sellerId"] },
              status: "active",
              isDeleted: false,
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "sellerProductIds",
      },
    },
    {
      $lookup: {
        from: "reviews",
        let: { productIds: "$sellerProductIds._id" },
        pipeline: [
          { $match: { $expr: { $in: ["$productId", "$$productIds"] } } },
          {
            $group: {
              _id: null,
              merchantAverageRating: { $avg: "$rating" },
              merchantReviewCount: { $sum: 1 },
            },
          },
        ],
        as: "merchantRatingStats",
      },
    },
 
    // Liked status lookup (if authenticated)
    ...(userId
      ? [
          {
            $lookup: {
              from: "productlikes",
              let: { productId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$product", "$$productId"] },
                        { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                      ],
                    },
                  },
                },
              ],
              as: "likeData",
            },
          } as PipelineStage,
        ]
      : []),

    // Flagged status lookup (if authenticated)
    ...(userId
      ? [
          {
            $lookup: {
              from: "productflags",
              let: { productId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$productId", "$$productId"] },
                        { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                      ],
                    },
                  },
                },
              ],
              as: "flagData",
            },
          } as PipelineStage,
        ]
      : []),
 
    // ---- ADD FIELDS ----
    {
      $addFields: {
        averageRating: {
          $ifNull: [{ $arrayElemAt: ["$ratingStats.averageRating", 0] }, 0],
        },
        reviewCount: {
          $ifNull: [{ $arrayElemAt: ["$ratingStats.reviewCount", 0] }, 0],
        },
        merchantRating: {
          $ifNull: [
            { $arrayElemAt: ["$merchantRatingStats.merchantAverageRating", 0] },
            0,
          ],
        },
        merchantReviewCount: {
          $ifNull: [
            { $arrayElemAt: ["$merchantRatingStats.merchantReviewCount", 0] },
            0,
          ],
        },
        ...(userId
          ? {
              isLiked: {
                $gt: [{ $size: { $ifNull: ["$likeData", []] } }, 0],
              },
              isFlagged: {
                $gt: [{ $size: { $ifNull: ["$flagData", []] } }, 0],
              },
            }
          : {}),
        sellerName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$seller.firstName", ""] },
                " ",
                { $ifNull: ["$seller.lastName", ""] },
              ],
            },
          },
        },
        sellerImage: { $ifNull: ["$seller.displayImage", ""] },
        sellerVerified: { $ifNull: ["$seller.isVerified", false] },
        sellerPhone: { $ifNull: ["$seller.mobile", ""] },
        sellerEmail: { $ifNull: ["$seller.email", ""] },
        stockStatus: {
          $cond: [
            { $gt: ["$availableQuantity", 0] },
            "in_stock",
            "out_of_stock",
          ],
        },
        isAvailable: { $gt: ["$availableQuantity", 0] },
        thumbnail: {
          $let: {
            vars: {
              primary: {
                $first: {
                  $filter: {
                    input: "$images",
                    as: "img",
                    cond: { $eq: ["$$img.isPrimary", true] },
                  },
                },
              },
            },
            in: {
              $ifNull: [
                "$$primary.imageUrl",
                { $arrayElemAt: ["$images.imageUrl", 0] },
              ],
            },
          },
        },
        finalPrice: {
          $cond: ["$isDiscounted", "$discountedPrice", "$price"],
        },
      },
    },
 
    // ---- MERCHANT RATING FILTER (post-aggregation) ----
    // Now correctly filters on the seller's aggregate rating across all
    // their products, not the rating of this single listing.
    ...(merchantRating
      ? [
          {
            $match: {
              merchantRating: { $gte: Number(merchantRating) },
            },
          } as PipelineStage,
        ]
      : []),
  ];
 
  // ---- SORTING ----
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_low_high: { finalPrice: 1 },
    price_high_low: { finalPrice: -1 },
    most_sold: { totalUnitsSold: -1 },
    highest_rated: { averageRating: -1 },
    nearest: { createdAt: -1 }, // Default fallback until geo-coordinates are implemented
  };
 
  pipeline.push({ $sort: sortMap[sortBy] || sortMap.latest });
 
  // ---- PAGINATION ----
  pipeline.push({
    $facet: {
      products: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            id: "$_id",
            name: 1,
            slug: 1,
            description: 1,
            brand: 1,
            category: {
              id: "$category._id",
              name: { $ifNull: ["$category.name", ""] },
              slug: { $ifNull: ["$category.slug", ""] },
            },
            thumbnail: 1,
            images: {
              $map: {
                input: "$images",
                as: "img",
                in: {
                  url: "$$img.imageUrl",
                  order: { $ifNull: ["$$img.order", 0] },
                },
              },
            },
            price: 1,
            currency: 1,
            unit: "$priceMetric",
            availableQuantity: 1,
            minimumOrder: { $ifNull: ["$minimumOrder", 1] },
            maximumOrder: { $ifNull: ["$maximumOrder", null] },
            stockStatus: 1,
            isAvailable: 1,
            isFeatured: { $ifNull: ["$isFeatured", false] },
            totalUnitsSold: { $ifNull: ["$totalUnitsSold", 0] },
            averageRating: { $round: ["$averageRating", 1] },
            reviewCount: 1,
            createdAt: 1,
            updatedAt: 1,
            ...(userId ? { isLiked: 1, isFlagged: 1 } : {}),
            merchant: {
              id: "$seller._id",
              businessName: { $ifNull: ["$seller.businessName", "$merchantName"] },
              displayName: "$sellerName",
              logo: "$sellerImage",
              rating: { $round: ["$merchantRating", 1] },
              totalReviews: "$merchantReviewCount",
              verified: "$sellerVerified",
              phone: "$sellerPhone",
              email: "$sellerEmail",
            },
            delivery: {
              state: { $arrayElemAt: ["$deliveryLocations.state", 0] },
              city: { $arrayElemAt: ["$deliveryLocations.lga", 0] },
            },
            deliveryTime: 1,
          },
        },
      ],
      pagination: [{ $count: "total" }],
    },
  });
 
  try {
    const [result] = await Product.aggregate(pipeline);
 
    const products = result?.products ?? [];
    const total = result?.pagination?.[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;
 
    return {
      success: true,
      data: products,
      meta: {
        total,
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    console.error("Fetch Products Error", error);
    throw error;
  }
};

export const deleteProduct = async(productId: string)=>{
    return await Product.findByIdAndDelete(productId)
};

export const fetchUserProducts = async(userId: string, page: number, limit: number)=>{
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments({userId: userId});

    const products = await Product.find({userId: userId})
    .skip(skip)
    .limit(limit)
    .populate('reviews', 'rating');
    
    const enhancedProducts = await Promise.all(
      products.map(async (product: any) => {
        const totalReviews = product.reviews.length;
        const averageRating =
          totalReviews > 0
            ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
            : 0;
  
        return {
          ...product.toObject(),
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(2)),
        };
      })
    );
   return {
    products: enhancedProducts,
    totalPages: Math.ceil(totalProducts/ limit),
    currentPage: page,
    totalProducts  
    };
};
export const ifLikedProduct = async (productId: string, userId: string)=>{
    return await ProductLike.findOne({ product: productId, user: userId });
};

export const createProductLike = async (data: any) =>{
    return await  ProductLike.create(data);
};


export const fetchLikedProducts = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
  
    
    const likedProducts = await ProductLike.find({ user: userId }).select('product').lean();
    const likedProductsId = likedProducts.map((like) => like.product);
  

    const products = await Product.find({ _id: { $in: likedProductsId } })
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
  
  export const unlikeProduct = async (productId: string, userId: string ) =>{
    
   return await ProductLike.findOneAndDelete({user: userId, product: productId});
  };

  
  export const fetchReviewForProduct = async (productId: string) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid productId");
    }
  
    const objectId = new mongoose.Types.ObjectId(productId);
  
    const result = await Review.aggregate([
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
  
export const fetchAllProductsForAdmin = async () => {
    return await Product.countDocuments();
};

export const fetchAllUserProductsAdmin = async (userId: string) => {
    return await Product.find({ userId });
};

export const fetchAllProductsAdmin = async (page: number, limit: number, search: string) => {
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
    Product.find(query)
      .populate('userId', 'fullName userName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query)
  ]);

  return {
    materials,
    totalMaterials,
  };
};
export const otherProductsByUser = async(userId: string, page: number, limit: number)=>{
  const skip = (page -1) * limit;

const products = await  Product.find({userId})
  .sort({ createdAt: -1 })
  .populate('reviews', 'rating')
  .skip(skip)
  .populate({
    path: 'userId',
    select: 'fullName email userName profileImage level uniqueId isPrimeMember',
  }).lean();

  const likedProducts = await ProductLike.find({ user: userId }).select('product').lean();
  const likedProductIds = likedProducts.map((like) => like.product.toString());
  const user = await User.findById(userId);
  const comparedProductIds = user?.comparedProducts.map((id: any) => id.toString()) || [];
    
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

export const fetchSimilarProducts = async (
  productId: string,
  limit = 8
) => {
  const currentProduct = await Product.findById(productId).select(
    "category subCategory brand price deliveryLocations"
  );

  if (!currentProduct) {
    return [];
  }

  const matchStage: any = {
    _id: { $ne: new mongoose.Types.ObjectId(productId) },
    isDeleted: false,
    status: "active",
  };

  matchStage.category = currentProduct.category;

  const similarProducts = await Product.aggregate([
    { $match: matchStage },

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
    const fallback = await Product.find({
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
export const fetchProductReviews = async (
  productId: string,
  page: number,
  limit: number,
  sortBy: 'mostRelevant' | 'newest' = 'newest'
) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Material not found!');
  }

  const skip = (Number(page) - 1) * Number(limit);

  const sortCriteria: { [key: string]: 1 | -1 } =
  sortBy === 'mostRelevant' ? { helpfulCount: -1, createdAt: -1 } : { createdAt: -1 };

  const reviews = await Review.find({ productId })
    .skip(skip)
    .limit(Number(limit))
    .sort(sortCriteria)
    .populate('userId', 'profileImage fullName userName uniqueId gender level')
    .lean()
    ;

  const allReviews = await Review.find({ productId }).lean();

  const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
    acc[star] = allReviews.filter((review) => review.rating === star).length;
    return acc;
  }, {} as Record<number, number>);

  const totalRatings = allReviews.length;
  const averageRating =
    totalRatings > 0
      ? allReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalRatings
      : 0;

  // Get product owner details
  const productOwner = await User.findById(product.userId)
    .select('firstName lastName displayImage email userName level uniqueId isPrimeMember')
    .lean();

  // Compute user/seller rating: average rating across all their products' reviews
  const sellerProducts = await Product.find({ userId: product.userId, isDeleted: false })
    .select('_id')
    .lean();
  const sellerProductIds = sellerProducts.map((p) => p._id);
  
  let sellerAverageRating = 0;
  let sellerTotalReviews = 0;
  if (sellerProductIds.length > 0) {
    const sellerRatingResult = await Review.aggregate([
      { $match: { productId: { $in: sellerProductIds } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    if (sellerRatingResult.length > 0) {
      sellerAverageRating = sellerRatingResult[0].averageRating || 0;
      sellerTotalReviews = sellerRatingResult[0].reviewCount || 0;
    }
  }

  const data = {
    averageRating: parseFloat(averageRating.toFixed(2)),
    numberOfRatings: totalRatings,
    starCounts,
    reviews,
    currentPage: Number(page),
    totalPages: Math.ceil(totalRatings / Number(limit)),
    productOwner: productOwner
      ? {
          _id: productOwner._id,
          fullName: `${productOwner.firstName || ''} ${productOwner.lastName || ''}`.trim(),
          profileImage: productOwner.displayImage || '',
          email: productOwner.email,
          userName: productOwner.userName,
          level: productOwner.level,
          uniqueId: productOwner.uniqueId,
          isPrimeMember: productOwner.isPrimeMember,
          averageRating: parseFloat(sellerAverageRating.toFixed(2)),
          numberOfReviews: sellerTotalReviews,
        }
      : null,
  };

  return data;
};

export const fetchAllComparedProducts = async (productIds: string[])=>{
  const products = await Product.find({ _id: { $in: productIds } })
  .populate('userId', 'fullName email userName uniqueId profileImage level gender')
  .populate('reviews', 'rating').lean()

  const enhancedProducts = await Promise.all(
    products.map(async (product: any) => {
      const reviews = product.reviews || [];
      const totalReviews = reviews.length;

      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
          : 0;


      return {
        ...product,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
      };
    })
  );

return {
  enhancedProducts
}
};

export const fetchAllLikedProducts = async(userId: string)=>{
  const likedProducts = await ProductLike.countDocuments({ user: userId });
  return {
    totalProductsLikes: likedProducts,
  };
};

export const createCategory = async(payload: any)=>{
  return await Category.create(payload);
};

export const deleteCategory = async(id: string)=>{
  return await Category.findByIdAndDelete(id);
};

export const fetchSingleCategory = async(id: string)=>{
  return await Category.findById(id);
};

export const fetchAllCategories = async()=>{
  return await Category.find({isActive: true});
};

// ==================== Product Flag ====================

export const ifFlaggedProduct = async (productId: string, userId: string) => {
  return await ProductFlag.findOne({ productId, userId });
};

export const flagProduct = async (data: any) => {
  return await ProductFlag.create(data);
};

export const unflagProduct = async (productId: string, userId: string) => {
  return await ProductFlag.findOneAndDelete({ productId, userId });
};


export const toggleReviewHelpful = async (
  reviewId: string,
  userId: string,
  isHelpful: string
) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const isInHelpful = review.helpfulUsers.some((id: any) =>
    id.equals(userObjectId)
  );

  const isInNotHelpful = review.notHelpfulUsers.some((id: any) =>
    id.equals(userObjectId)
  );

  if (isHelpful === 'true') {
    // Remove from not helpful
    if (isInNotHelpful) {
      review.notHelpfulUsers = review.notHelpfulUsers.filter(
        (id: any) => !id.equals(userObjectId)
      );
    }

    // Toggle helpful
    if (isInHelpful) {
      review.helpfulUsers = review.helpfulUsers.filter(
        (id: any) => !id.equals(userObjectId)
      );
    } else {
      review.helpfulUsers.push(userObjectId);
    }
  } else if(isHelpful == 'false') {
    // Remove from helpful
    if (isInHelpful) {
      review.helpfulUsers = review.helpfulUsers.filter(
        (id: any) => !id.equals(userObjectId)
      );
    }

    // Toggle not helpful
    if (isInNotHelpful) {
      review.notHelpfulUsers = review.notHelpfulUsers.filter(
        (id: any) => !id.equals(userObjectId)
      );
    } else {
      review.notHelpfulUsers.push(userObjectId);
    }
  }

  // Always derive counts from arrays
  review.helpfulCount = review.helpfulUsers.length;
  review.notHelpfulCount = review.notHelpfulUsers.length;

  await review.save();

  return {
    helpfulCount: review.helpfulCount,
    notHelpfulCount: review.notHelpfulCount,
    isHelpful: review.helpfulUsers.some((id: any) => id.equals(userObjectId)),
    isNotHelpful: review.notHelpfulUsers.some((id: any) =>
      id.equals(userObjectId)
    ),
  };
};