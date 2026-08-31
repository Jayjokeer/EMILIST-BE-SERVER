import { Schema, Document} from "mongoose";
import { CartStatus } from "../enums/cart.enum";

export interface ICartProduct {
    productId: Schema.Types.ObjectId; 
    quantity: number;
    price: number; 
  }
  export interface IAppliedPromoCode {
    discountId: Schema.Types.ObjectId;
    code: string;
  }

  export interface ICart extends Document {
    userId?: Schema.Types.ObjectId; 
    products?: ICartProduct[]; 
    // Promo codes the buyer applied. Product/seller scoped - resolved against
    // the Discount collection; totalAmount always stays the gross product total.
    appliedPromoCodes?: IAppliedPromoCode[]; 
    totalAmount?: number; 
    status?: CartStatus;
    isPaid?: boolean; 
  }