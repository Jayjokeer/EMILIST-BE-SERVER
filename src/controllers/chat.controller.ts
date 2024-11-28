import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import * as chatService  from "../services/chat.services";
import * as messageService  from "../services/message.service";
import { IChat } from "../interfaces/chat.interface";
import { IMessage } from "../interfaces/message.interface";
import { getReceiverId } from "../socket";
import {io} from "../server";
import { NotificationTypeEnum } from "../enums/notification.enum";
import * as notificationService from "../services/notification.service";
import * as userService from "../services/auth.service";
import { sendEmail } from "../utils/send_email";
import { otpMessage, sendMessage } from "../utils/templates";

export const sendMessageController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { receiverId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;
  let isNewChat = false;
  let chat = await chatService.findChat(receiverId, userId);
  if (!chat) {
    const payload: IChat = {
      participants: [receiverId, userId],
      messages: [],
    };
    chat = await chatService.createChat(payload);
    isNewChat = true;
  }

  const msgPayload: IMessage = {
    receiverId,
    senderId: userId,
    content,
    chatId: chat._id,
  };

  const newMessage = await messageService.createMessage(msgPayload);
  chat.messages.push(newMessage._id);

  await Promise.all([chat.save(), newMessage.save()]);
  const data = newMessage;

  const receiverSocketId = getReceiverId(receiverId);
  if (receiverSocketId && io) {
    io.to(receiverSocketId).emit("newMessage", data);
  }
  if(isNewChat){
    const user = await userService.findUserById(receiverId);

    const notificationPayload = {
      userId: receiverId,
      title: "You have a new message",
      message: `${req.user.userName} sent you a message!`,
      type: NotificationTypeEnum.info
    }

    const {html, subject} = sendMessage(user!.userName, req.user.userName);
   await sendEmail(user!.email, subject,html); 
    await notificationService.createNotification(notificationPayload);
  }
 
  successResponse(res, StatusCodes.CREATED, data);
});
  export const getMessagesController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { userId} = req.params;
    const loggedInUserId = req.user._id;

    const data = await chatService.findChatWithMessages(loggedInUserId,userId);

    successResponse(res, StatusCodes.OK, data);
  });   

  export const getChatsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const loggedInUserId = req.user._id;
  
    const data = await chatService.getChatsWithLastMessages(loggedInUserId);
  
    successResponse(res, StatusCodes.OK, data);
  });