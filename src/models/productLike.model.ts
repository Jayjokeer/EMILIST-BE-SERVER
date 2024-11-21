import mongoose, { Schema, model } from 'mongoose';


const ProductLikeSchema= new Schema({
   product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  }, { timestamps: true });
  

export default mongoose.model('ProductLike', ProductLikeSchema);