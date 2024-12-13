import { Schema, Document} from "mongoose";
import { CartStatus } from "../enums/cart.enum";

export interface ICartProduct {
    productId: Schema.Types.ObjectId; 
    quantity: number;
    price: number; 
  }
  export interface ICart extends Document {
    userId?: Schema.Types.ObjectId; 
    products?: ICartProduct[]; 
    totalAmount?: number; 
    status?: CartStatus;
    isPaid?: boolean; 
  }