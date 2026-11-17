"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.markChatAsReadController = exports.getChatsController = exports.getMessagesController = exports.sendMessageController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const http_status_codes_1 = require("http-status-codes");
const chatService = __importStar(require("../services/chat.services"));
const messageService = __importStar(require("../services/message.service"));
const socket_1 = require("../socket");
const server_1 = require("../server");
const notification_enum_1 = require("../enums/notification.enum");
const notificationService = __importStar(require("../services/notification.service"));
const userService = __importStar(require("../services/auth.service"));
const send_email_1 = require("../utils/send_email");
const templates_1 = require("../utils/templates");
const error_1 = require("../errors/error");
exports.sendMessageController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { receiverId } = req.params;
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const userId = String(req.user._id);
    const files = req.files || [];
    const attachments = files.map(file => ({
        url: file.path,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: messageService.getMessageAttachmentType(file.mimetype),
    }));
    if (String(receiverId) === userId)
        throw new error_1.BadRequestError("You cannot message yourself");
    if (!content && attachments.length === 0)
        throw new error_1.BadRequestError("Message content or an attachment is required");
    if (content.length > 5000)
        throw new error_1.BadRequestError("Message content cannot exceed 5000 characters");
    const receiver = await userService.findUserById(String(receiverId));
    if (!receiver)
        throw new error_1.NotFoundError("Receiver not found");
    let chat = await chatService.findChat(String(receiverId), userId);
    if (!chat) {
        const payload = {
            participants: [receiverId, userId],
            messages: [],
        };
        chat = await chatService.createChat(payload);
    }
    const msgPayload = {
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
    const receiverSocketId = (0, socket_1.getReceiverId)(receiverId);
    if (receiverSocketId && server_1.io) {
        server_1.io.to((0, socket_1.getUserRoom)(String(receiverId))).emit("newMessage", data);
    }
    else {
        try {
            const senderName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || req.user?.userName || "An Emilist user";
            const receiverName = [receiver.firstName, receiver.lastName].filter(Boolean).join(" ") || receiver.userName || "there";
            const notificationPayload = {
                userId: receiverId,
                title: "You have a new message",
                message: `${senderName} sent you a message!`,
                type: notification_enum_1.NotificationTypeEnum.message,
                resourceId: String(chat._id),
                action: "new_message",
                metadata: {
                    chatId: String(chat._id),
                    messageId: String(newMessage._id),
                    senderId: String(userId),
                },
            };
            await notificationService.createNotification(notificationPayload);
            const { html, subject } = (0, templates_1.sendMessage)(receiverName, senderName);
            await (0, send_email_1.sendEmail)(receiver.email, subject, html);
        }
        catch (error) {
            console.error("Unable to deliver offline message notification:", error);
        }
    }
    server_1.io.to((0, socket_1.getUserRoom)(userId)).emit("messageSent", data);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.getMessagesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const loggedInUserId = String(req.user._id);
    const { page, limit } = req.query;
    const data = await chatService.findChatWithMessages(loggedInUserId, String(userId), {
        page: page,
        limit: limit,
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.getChatsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const loggedInUserId = String(req.user._id);
    const { page, limit, search } = req.query;
    const data = await chatService.getChatsWithLastMessages(loggedInUserId, { page: page, limit: limit }, typeof search === "string" ? search : "");
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.markChatAsReadController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await chatService.markChatAsRead(String(req.params.chatId), String(req.user._id));
    if (data.senderId && data.markedCount > 0) {
        server_1.io.to((0, socket_1.getUserRoom)(data.senderId)).emit("messagesRead", {
            chatId: String(data.chatId),
            readerId: String(req.user._id),
            messageIds: data.messageIds,
            readAt: data.readAt,
        });
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        chatId: data.chatId,
        markedCount: data.markedCount,
        messageIds: data.messageIds,
        readAt: data.readAt,
    });
});
