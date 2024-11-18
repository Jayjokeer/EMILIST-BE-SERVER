import mongoose from "mongoose";

export interface IMessage{
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    content: string;
}