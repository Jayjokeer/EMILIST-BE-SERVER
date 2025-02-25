import mongoose, { Schema } from "mongoose";


const CategorySchema = new Schema({
    category: {type: String},
    isActive: {type: Boolean, default: true}
  },
{timestamps: true});

export default mongoose.model('Category', CategorySchema);