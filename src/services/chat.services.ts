import mongoose from "mongoose";
import { NotFoundError } from "../errors/error";
import { IChat } from "../interfaces/chat.interface";
import Chat from "../models/chat.model";

export const createChat= async (data: IChat)=>{
    return  Chat.create(data);
};

export const findChat = async(recieverId:string ,senderId:string) =>{
    return Chat.findOne({
        participants:{$all:[recieverId, senderId]}
    });
};
export const findChatWithMessages = async(recieverId:string ,senderId:string) =>{
    return Chat.findOne({
        participants:{$all:[recieverId, senderId]}
    }).populate('messages');
};
export const getChatsWithLastMessages = async (userId: string) => {
  try {
    const chats = await Chat.aggregate([
      {
        $match: { participants: new mongoose.Types.ObjectId(userId) }, 
      },
      {
        $lookup: {
          from: "messages", 
          localField: "_id",
          foreignField: "chatId", 
          as: "messages",
        },
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ["$messages", -1] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants",
        },
      },
      {
        $project: {
          _id: 1,
          participants: {
            $filter: {
              input: "$participants",
              as: "participant",
              cond: { $ne: ["$$participant._id", new mongoose.Types.ObjectId(userId)] },
            },
          },
          lastMessage: 1,
        },
      },
    ]);

    return chats.map((chat) => ({
      chatId: chat._id,
      participants: chat.participants.map((p: any) => ({
        fullName: p.fullName,
        profileImage: p.profileImage,
        email: p.email,
        userName: p.userName,
      })),
      lastMessage: chat.lastMessage,
    }));
  } catch (error) {
    console.error(error);
    throw new NotFoundError("Error fetching chats with last messages");
  }
};
