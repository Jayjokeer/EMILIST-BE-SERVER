import mongoose, { Document, Schema } from 'mongoose';
import { IChat } from '../interfaces/chat.interface';

const chatSchema = new Schema<IChat>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "Users", required: true }],
        messages: [
            {
              type: Schema.Types.ObjectId,
              ref: 'Message',
            },
          ],
      },
     { timestamps: true }
);

export default mongoose.model<IChat>('Chat', chatSchema);