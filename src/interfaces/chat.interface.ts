import mongoose from "mongoose";

export interface IChat {
    participants: string[];
    messages: mongoose.Types.ObjectId[]; 
}