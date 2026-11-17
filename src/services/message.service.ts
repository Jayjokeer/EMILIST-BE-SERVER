import { IMessage, MessageAttachmentType } from "../interfaces/message.interface";
import Message from "../models/message.model";

export const createMessage= async (data: IMessage)=>{
    return  Message.create(data);
}

export const getMessageAttachmentType = (mimeType: string): MessageAttachmentType => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/") || mimeType === "video/webm") return "audio";
    return "file";
};
