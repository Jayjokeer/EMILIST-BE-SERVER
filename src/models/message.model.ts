import mongoose, { Document, Schema } from 'mongoose';
import { IMessage } from '../interfaces/message.interface';

const messageAttachmentSchema = new Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['image', 'file', 'audio'], required: true },
}, { _id: false });

const messageSchema = new Schema<IMessage>({
    senderId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    content: { type: String, trim: true, default: '' },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    attachments: { type: [messageAttachmentSchema], default: [] },
    readAt: { type: Date, default: null },
},  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, readAt: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
