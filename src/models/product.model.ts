import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from '../interfaces/product.interface';

const productSchema: Schema = new mongoose.Schema(
  {
    name: { type: String},
    category: [{ type: String }],
    brand: [{ type: String }],
    description: { type: String},
    images: [{ type: String }],
    availableQuantity: { type: String },
    price: { type: Number },
    storeName: { type: String},
    location: {type: String},
    currency: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'Users'},
    // orders: [{type:  Schema.Types.ObjectId, ref: 'Orders'}]
  },
  { timestamps: true }

);

export default mongoose.model<IProduct>('Product', productSchema);