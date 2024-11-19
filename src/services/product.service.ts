import { IProduct } from "../interfaces/product.interface";
import Product from "../models/product.model";

export const createProduct = async (data: IProduct)=>{
    return await Product.create(data);
};

export const fetchProductById = async (productId: string) =>{
    return await Product.findById(productId);
};

export const fetchAllProducts = async ()=>{
    return await Product.find();
};