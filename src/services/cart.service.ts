import { CartStatus } from "../enums/cart.enum"
import { ICart } from "../interfaces/cart.interface"
import Cart from "../models/cart.model"
import Discount from "../models/discount.model"

export const createCart = async(payload: any) =>{
    return await Cart.create(payload);
};

export const fetchCartByUser = async (userId: string)=>{
    return await Cart.findOne({userId, status: CartStatus.active}).populate("products.productId");
};

export const fetchCartById = async (cartId: string)=>{
    return await Cart.findById(cartId);
};
export const deleteCart = async (cartId: string) =>{
    return await Cart.findByIdAndDelete(cartId);
};
