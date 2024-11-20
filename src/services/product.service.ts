import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";

export const createProduct = async (data: IProduct)=>{
    return await Product.create(data);
};

export const fetchProductById = async (productId: any) =>{
    return await Product.findById(productId);
};

export const fetchAllProducts = async (
    page: number,
    limit: number,
)=>{
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments().skip(skip).limit(limit);

    const products = await Product.find();
   return {
    products,
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
