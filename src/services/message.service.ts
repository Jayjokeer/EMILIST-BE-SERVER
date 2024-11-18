import { IMessage } from "../interfaces/message.interface";
import Message from "../models/message.model";

export const createMessage= async (data: IMessage)=>{
    return  Message.create(data);
}