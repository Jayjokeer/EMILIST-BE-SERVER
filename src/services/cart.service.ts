import { CartStatus } from "../enums/cart.enum"
import { ICart } from "../interfaces/cart.interface"
import Cart from "../models/cart.model"

export const createCart = async(payload: any) =>{
    return await Cart.create(payload);
};

export const fetchCartByUser = async (userId: string)=>{
    return await Cart.findOne({userId, status: CartStatus.active});
};

export const fetchCartById = async (cartId: string)=>{
    return await Cart.findById(cartId);
};
