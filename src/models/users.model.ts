import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../interfaces/user.interface';


const userSchema: Schema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userName: { type: String, required: true },
    uniqueId: { type: String, required: false },
    gender: { type: String, required: false },
    language: {type: String},
    number1: {type: String},
    number2: {type: String},
    whatsAppNo: {type: String},
    location: {type: String},
    bio: {type: String},
    membership: {
        type: mongoose.Schema.Types.Mixed,
      },
    verified: {type: Boolean, default: false},
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);