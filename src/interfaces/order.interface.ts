import { Schema } from "mongoose";
import { OrderDeliveryStatus, OrderPaymentStatus, OrderStatus } from "../enums/order.enum";

export interface IOrderProduct {
    productId: Schema.Types.ObjectId;
    quantity: number; 
    price: number;
    // === Snapshot fields captured at order-creation time ===
    productName?: string;
    brand?: string;
    categoryName?: string;
    thumbnail?: string;
    quantityMetric?: string;
    merchantId?: Schema.Types.ObjectId;
    merchantName?: string;
    merchantRating?: number;
    merchantReviewCount?: number;
    totalUnitsSoldAtPurchase?: number;
}

export interface IDeliveryStep {
    status: OrderDeliveryStatus;
    timestamp: Date;
    note?: string;
}

export interface IOrder extends Document {
    userId?: Schema.Types.ObjectId; 
    products?: IOrderProduct[]; 
    subtotalAmount?: number;
    taxAmount?: number;
    shippingAmount?: number;
    totalAmount?: number; 
    status?: OrderStatus; 
    paymentStatus?: OrderPaymentStatus; 
    shippingAddress?: string;
    orderNote?: string;
    discountApplied?:boolean;
    discountAmount?: number;
    originalTotalAmount?: number;
    discountCode?:string;
    cartId: any;
    // === Delivery / tracking ===
    deliveryStatus?: OrderDeliveryStatus;
    deliveryDate?: Date;
    deliveredAt?: Date;
    deliverySteps?: IDeliveryStep[];
    cancelReason?: string;
    cancelledAt?: Date;
    returnReason?: string;
    returnedAt?: Date;
};