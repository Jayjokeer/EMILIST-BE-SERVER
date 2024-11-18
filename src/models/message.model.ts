import mongoose, { Document, Schema } from 'mongoose';
import { IMessage } from '../interfaces/message.interface';

const messageSchema = new Schema<IMessage>({
    senderId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    content: { type: String, required: true },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
},  { timestamps: true }
)

export default mongoose.model<IMessage>('Message', messageSchema);