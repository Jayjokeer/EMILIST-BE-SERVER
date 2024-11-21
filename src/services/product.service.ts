import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";
import ProductLike from "../models/productLike.model";

export const createProduct = async (data: IProduct)=>{
    return await Product.create(data);
};

export const fetchProductById = async (productId: any) =>{
    return await Product.findById(productId);
};

export const fetchAllProducts = async (
    page: number,
    limit: number,
    userId: string,
)=>{
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments().skip(skip).limit(limit);

    const products = await Product.find();
    let productsWithLikeStatus;
    if (userId) {
      const likedProducts = await ProductLike.find({ user: userId }).select('product').lean();
      const likedProductIds = likedProducts.map((like) => like.product.toString());
  
      productsWithLikeStatus= products.map((product) => ({
        ...product.toObject(),
        liked: likedProductIds.includes(product._id.toString()),
      }));
    } else {
        productsWithLikeStatus = products.map((product) => ({
        ...product.toObject(),
        liked: false,
      }));
    }
   return {
    products: productsWithLikeStatus,
    totalPages: Math.ceil(totalProducts/ limit),
    currentPage: page,
    totalProducts  
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
      .limit(limit);
  
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