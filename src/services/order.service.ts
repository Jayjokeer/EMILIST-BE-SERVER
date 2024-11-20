import { IOrder } from "../interfaces/order.interface";
import Order from "../models/order.model";

export const createOrder= async(payload:any)=>{
    return await Order.create(payload);
}