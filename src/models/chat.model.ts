import mongoose, { Document, Schema } from 'mongoose';
import { IChat } from '../interfaces/chat.interface';

const chatSchema = new Schema<IChat>({
    
},  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', chatSchema);