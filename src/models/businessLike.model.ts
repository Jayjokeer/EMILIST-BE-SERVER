import mongoose, { Schema, model } from 'mongoose';


const businessSchema = new Schema({
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  }, { timestamps: true });
  

  export default mongoose.model('BusinessLike', businessSchema);