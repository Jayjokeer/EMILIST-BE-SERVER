import mongoose, { Document, Schema } from 'mongoose';
import { IMessage } from '../interfaces/message.interface';

const messageSchema = new Schema<IMessage>({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
},  { timestamps: true }
)

export default mongoose.model<IMessage>('Message', messageSchema);