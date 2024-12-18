import mongoose from "mongoose";
import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";
import ProductLike from "../models/productLike.model";
import Review from "../models/review.model";

export const createProduct = async (data: IProduct)=>{
    return await Product.create(data);
};

export const fetchProductById = async (productId: any) =>{
    return await Product.findById(productId);
};
export const fetchProductByIdWithDetails = async (productId: any) =>{
    return await Product.findById(productId).populate('userId', 'fullName email userName profileImage level _id uniqueId');
};


export const fetchAllProducts = async (
  page: number,
  limit: number,
  userId: string,
  filters: {
    priceRange?: [number, number];
    minRating?: number;
    minReviews?: number;
    isPrimeMember?: boolean;
  }
) => {
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};

  if (filters.priceRange) {
    query.price = {
      $gte: filters.priceRange[0],
      $lte: filters.priceRange[1],
    };
  }


  const totalProducts = await Product.countDocuments(query);

  const products = await Product.find(query)
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

  const reviews = await Review.aggregate([
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
    .map((product) => ({
      ...product,
      averageRating: reviewMap[product._id.toString()]?.averageRating || 0,
      numberOfRatings: reviewMap[product._id.toString()]?.numberOfRatings || 0,
    }))
    .filter((product) => {
      if (filters.minRating && product.averageRating < filters.minRating) return false;
      if (filters.minReviews && product.numberOfRatings < filters.minReviews) return false;
      return true;
    });

  let productsWithDetails;
  if (userId) {
    const likedProducts = await ProductLike.find({ user: userId }).select('product').lean();
    const likedProductIds = likedProducts.map((like) => like.product.toString());

    productsWithDetails = enhancedProducts.map((product) => ({
      ...product,
      liked: likedProductIds.includes(product._id.toString()),
    }));
  } else {
    productsWithDetails = enhancedProducts.map((product) => ({
      ...product,
      liked: false,
    }));
  }

  return {
    products: productsWithDetails,
    totalPages: Math.ceil(totalProducts / limit),
    currentPage: page,
    totalProducts:productsWithDetails.length,
  };
};


export const deleteProduct = async(productId: string)=>{
    return await Product.findByIdAndDelete(productId)
};

export const fetchUserProducts = async(userId: string, page: number, limit: number)=>{
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments({userId: userId}).skip(skip).limit(limit);

    const products = await Product.find({userId: userId});
   return {
    products,
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
  