import mongoose from "mongoose";

export interface IChat {
    participants: Array<string | mongoose.Types.ObjectId>;
    messages: mongoose.Types.ObjectId[]; 
}
