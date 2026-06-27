import mongoose, { Types, PipelineStage } from "mongoose";
import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";
import ProductLike from "../models/productLike.model";
import Review from "../models/review.model";
import { NotFoundError } from "../errors/error";
import User from "../models/users.model";
import Category from "../models/categories.model";
import slugify from "slugify";

export const createProduct = async (userId: string, data: IProduct) => {
  const payload: any = { ...data };

  payload.userId = new Types.ObjectId(userId);


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
    }));
  }

  return await Product.create(payload);
};

export const fetchProductById = async (productId: any) =>{
    return await Product.findById(productId);
    
};
export const fetchProductByIdWithDetails = async (productId: any) =>{
    return await Product.findById(productId)
    .populate('userId', 'fullName email userName profileImage level _id uniqueId')
    .populate('reviews', 'rating');

};

export const fetchAllProducts = async (query: any) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || 20, 1);
  const skip = (page - 1) * limit;

  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    deliveryState,
    deliveryLga,
    minRating,
    maxDeliveryTime,
    isDiscounted,
    inStock,
    sort = "newest",
  } = query;

  const match: Record<string, any> = {
    status: "active",
    isDeleted: false,
  };

  if (
    category &&
    mongoose.Types.ObjectId.isValid(category)
  ) {
    match.category = new mongoose.Types.ObjectId(category);
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

  const sortMap: Record<string, Record<string, 1 | -1>> = {
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

  const pipeline: PipelineStage[] = [
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
  ]
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

              isPrimeMember:
                "$sellerPrimeMember",

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
    const [result] = await Product.aggregate(pipeline);

    const products = result?.products ?? [];

    const total =
      result?.pagination?.[0]?.total ?? 0;

    const totalPages =
      Math.ceil(total / limit) || 1;

    return {
      success: true,

      data: products,

      meta: {
        total,

        page,

        limit,

        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,

        nextPage:
          page < totalPages
            ? page + 1
            : null,

        previousPage:
          page > 1
            ? page - 1
            : null,
      },
    };
  } catch (error) {
    console.error(
      "Fetch Products Error",
      error
    );

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

export const fetchSimilarProducts = async (productId: string, limit: number, page: number, userId: string) => {
 const skip = (page -1) * limit;

  const targetProduct  = await Product.findById(productId);

  if(!targetProduct){
    throw new NotFoundError("Product not found!");
  }
  const query: Record<string, any> = {
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
  const similarProducts =  await Product.find(query)
  .limit(Number(limit))
  .skip(skip)
  .populate('reviews', 'rating')
  .populate({
    path: 'userId',
    select: 'fullName email userName profileImage level uniqueId isPrimeMember',
  });
  
  const enhancedProducts = await Promise.all(
    similarProducts.map(async (product: any) => {
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
  let productsWithDetails;
  if (userId) {
    const likedProducts = await ProductLike.find({ user: userId }).select('product').lean();
    const likedProductIds = likedProducts.map((like) => like.product.toString());
      const user = await User.findById(userId);
      const comparedProductIds = user?.comparedProducts.map((id: any) => id.toString()) || [];
      
    productsWithDetails = enhancedProducts.map((product) => ({
      ...product,
      liked: likedProductIds.includes(product._id.toString()),
      isCompared: comparedProductIds.includes(product._id.toString()),
    }));
  } else {
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