import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from '../interfaces/product.interface';

const ProductImagesSchema = new Schema({
    imageUrl: {type: String},
  })
const productSchema: Schema = new mongoose.Schema(
  {
    name: { type: String},
    category: { type: String },
    subCategory: { type: String },
    brand: { type: String },
    description: { type: String},
    images: [{ type:ProductImagesSchema }],
    availableQuantity: { type: Number},
    price: { type: Number },
    storeName: { type: String},
    location: {type: String},
    currency: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'Users'},
    discountedPrice: {type: Number},
    isDiscounted: {type: Boolean, default: false}, 
    // orders: [{type:  Schema.Types.ObjectId, ref: 'Order'}],
    reviews: [{type:  Schema.Types.ObjectId, ref: 'Review'}]
  },
  { timestamps: true }

);

export default mongoose.model<IProduct>('Product', productSchema);