import mongoose from "mongoose";

export interface IMessage{
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    content: string;
    chatId: mongoose.Types.ObjectId;
}