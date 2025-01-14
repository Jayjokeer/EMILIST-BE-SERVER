import mongoose, { Document, Schema } from 'mongoose';

const newsLetterSchema = new Schema({
    email: { type: String,  required: true },
},  { timestamps: true }
)

export default mongoose.model('Newsletter', newsLetterSchema);