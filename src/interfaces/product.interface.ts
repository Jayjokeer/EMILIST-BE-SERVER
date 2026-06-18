import { Types } from "mongoose";

export interface IProductImage {
  _id?: Types.ObjectId;
  imageUrl: string;
  isPrimary: boolean;
}

export interface IDeliveryLocation {
  state: string;
  lga: string;
}

export interface IProductClicks {
  users: Types.ObjectId[];
  clickCount: number;
}

export interface IProduct {
  _id?: Types.ObjectId;

  name: string;
  slug?: string;

  category: Types.ObjectId;

  subCategory?: string;
  brand?: string;

  description: string;

  images: IProductImage[];

  availableQuantity: number;
  quantityMetric: "bag" | "kg" | "ton";

  price: number;
  currency: string;

  priceMetric: "bag" | "kg" | "ton";

  merchantName: string;
  storeName?: string;

  deliveryLocations: IDeliveryLocation[];

  isDiscounted: boolean;
  discountedPrice?: number;

  status: "draft" | "pending" | "active" | "rejected" | "inactive" | "sold_out";

  reviews: Types.ObjectId[];

  clicks: IProductClicks;

  userId: Types.ObjectId;

  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;

  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}