import mongoose from "mongoose";

export type MessageAttachmentType = "image" | "file" | "audio";

export interface IMessageAttachment {
    url: string;
    name: string;
    mimeType: string;
    size: number;
    type: MessageAttachmentType;
}

export interface IMessage{
    senderId: mongoose.Types.ObjectId | string;
    receiverId: mongoose.Types.ObjectId | string;
    content: string;
    chatId: mongoose.Types.ObjectId | string;
    attachments?: IMessageAttachment[];
    readAt?: Date | null;
}
