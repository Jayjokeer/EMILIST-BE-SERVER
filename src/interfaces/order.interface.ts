import { Schema } from "mongoose";
import { OrderPaymentStatus, OrderStatus } from "../enums/order.enum";

export interface IOrderProduct {
    productId: Schema.Types.ObjectId;
    quantity: number; 
    price: number; 
  }

export interface IOrder extends Document {
    userId?: Schema.Types.ObjectId; 
    products?: IOrderProduct[]; 
    totalAmount?: number; 
    status?: OrderStatus; 
    paymentStatus?: OrderPaymentStatus; 
    shippingAddress?: string;
  }