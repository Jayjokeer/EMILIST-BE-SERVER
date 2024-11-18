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
      const chats = await Chat.find({ participants: userId })
        .populate({
          path: 'messages',
          options: { sort: { createdAt: -1 }, limit: 1 }, 
        })
        .populate('participants', 'fullName profileImage email')
        .exec();
  
      const chatList = chats.map((chat) => {
        const lastMessage = chat.messages[0] || null;
        return {
          chatId: chat._id,
          participants: chat.participants.filter((participant: any) => participant._id.toString() !== userId),
          lastMessage: lastMessage,
        };
      });
  
      return chatList;
    } catch (error) {
      throw new NotFoundError('Error fetching chats with last messages');
    }
  };