import { IOrder } from "../interfaces/order.interface";
import Order from "../models/order.model";

export const createOrder= async(payload:any)=>{
    return await Order.create(payload);
}
export const fetchOrderByCartId = async (cartId: string)=>{
    return await Order.findOne({cartId});
}
export const fetchOrderByOrderId  = async (orderId: string)=>{
    return await Order.findById(orderId);
}