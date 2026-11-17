import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { StatusCodes } from "http-status-codes";
import { Response } from "express";
import * as chatService  from "../services/chat.services";
import * as messageService  from "../services/message.service";
import { IChat } from "../interfaces/chat.interface";
import { IMessage } from "../interfaces/message.interface";
import { getReceiverId, getUserRoom } from "../socket";
import {io} from "../server";
import { NotificationTypeEnum } from "../enums/notification.enum";
import * as notificationService from "../services/notification.service";
import * as userService from "../services/auth.service";
import { sendEmail } from "../utils/send_email";
import { sendMessage } from "../utils/templates";
import { BadRequestError, NotFoundError } from "../errors/error";

export const sendMessageController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { receiverId } = req.params;
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  const userId = String(req.user._id);
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const attachments = files.map(file => ({
    url: file.path,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    type: messageService.getMessageAttachmentType(file.mimetype),
  }));

  if (String(receiverId) === userId) throw new BadRequestError("You cannot message yourself");
  if (!content && attachments.length === 0) throw new BadRequestError("Message content or an attachment is required");
  if (content.length > 5000) throw new BadRequestError("Message content cannot exceed 5000 characters");

  const receiver = await userService.findUserById(String(receiverId));
  if (!receiver) throw new NotFoundError("Receiver not found");

  let chat = await chatService.findChat(String(receiverId), userId);
  if (!chat) {
    const payload: IChat = {
      participants: [receiverId, userId],
      messages: [],
    };
    chat = await chatService.createChat(payload);
  }

  const msgPayload: IMessage = {
    receiverId,
    senderId: userId,
    content,
    chatId: chat._id,
    attachments,
    readAt: null,
  };

  const newMessage = await messageService.createMessage(msgPayload);
  chat.messages.push(newMessage._id);
  await chat.save();
  const data = newMessage.toObject();

  const receiverSocketId = getReceiverId(receiverId);
  if (receiverSocketId && io) {
    io.to(getUserRoom(String(receiverId))).emit("newMessage", data);
  }else {
    try {
      const senderName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || req.user?.userName || "An Emilist user";
      const receiverName = [receiver.firstName, receiver.lastName].filter(Boolean).join(" ") || receiver.userName || "there";
      const notificationPayload = {
        userId: receiverId,
        title: "You have a new message",
        message: `${senderName} sent you a message!`,
        type: NotificationTypeEnum.message,
        resourceId: String(chat._id),
        action: "new_message",
        metadata: {
          chatId: String(chat._id),
          messageId: String(newMessage._id),
          senderId: String(userId),
        },
      };
      await notificationService.createNotification(notificationPayload);

      const { html, subject } = sendMessage(receiverName, senderName);
      await sendEmail(receiver.email, subject, html);
    } catch (error) {
      console.error("Unable to deliver offline message notification:", error);
    }
  }

  io.to(getUserRoom(userId)).emit("messageSent", data);
 
 return successResponse(res, StatusCodes.CREATED, data);
});
export const getMessagesController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { userId } = req.params;
    const loggedInUserId = String(req.user._id);
    const { page, limit } = req.query;

    const data = await chatService.findChatWithMessages(loggedInUserId, String(userId), {
      page: page as string | undefined,
      limit: limit as string | undefined,
    });

    return successResponse(res, StatusCodes.OK, data);
});

export const getChatsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const loggedInUserId = String(req.user._id);
    const { page, limit, search } = req.query;
  
    const data = await chatService.getChatsWithLastMessages(
      loggedInUserId,
      { page: page as string | undefined, limit: limit as string | undefined },
      typeof search === "string" ? search : "",
    );
  
   return successResponse(res, StatusCodes.OK, data);
});

export const markChatAsReadController = catchAsync(async (req: JwtPayload, res: Response) => {
  const data = await chatService.markChatAsRead(String(req.params.chatId), String(req.user._id));

  if (data.senderId && data.markedCount > 0) {
    io.to(getUserRoom(data.senderId)).emit("messagesRead", {
      chatId: String(data.chatId),
      readerId: String(req.user._id),
      messageIds: data.messageIds,
      readAt: data.readAt,
    });
  }

  return successResponse(res, StatusCodes.OK, {
    chatId: data.chatId,
    markedCount: data.markedCount,
    messageIds: data.messageIds,
    readAt: data.readAt,
  });
});
