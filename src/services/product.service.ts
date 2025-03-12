import mongoose from "mongoose";
import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";
import ProductLike from "../models/productLike.model";
import Review from "../models/review.model";
import { NotFoundError } from "../errors/error";
import User from "../models/users.model";
import Category from "../models/categories.model";

export const createProduct = async (data: IProduct)=>{
    return await Product.create(data);
};

export const fetchProductById = async (productId: any) =>{
    return await Product.findById(productId);
    
};
export const fetchProductByIdWithDetails = async (productId: any) =>{
    return await Product.findById(productId)
    .populate('userId', 'fullName email userName profileImage level _id uniqueId')
    .populate('reviews', 'rating');

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
    location?: string;
  },
  search?: string,

) => {
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};

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

    const productFields = ['name', 'description', 'location', 'name', 'category', 'subCategory','storeName', 'brand' ];
    productFields.forEach(field => {
      query.$or.push({ [field]: { $regex: search, $options: 'i' } });
    });
  }
  const totalProducts = await Product.countDocuments(query);

  const products = await Product.find(query)
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
  });

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

  if (targetProduct.location || targetProduct.category || targetProduct.subCategory || targetProduct.brand || targetProduct.name) {
    query.$or = [
      { location : targetProduct.location },
      { category: targetProduct.category},
      { subCategory: targetProduct.subCategory},
      { brand: targetProduct.brand},
      { name: targetProduct.name},

    ];
  };
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