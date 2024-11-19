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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatsController = exports.getMessagesController = exports.sendMessageController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const http_status_codes_1 = require("http-status-codes");
const chatService = __importStar(require("../services/chat.services"));
const messageService = __importStar(require("../services/message.service"));
const socket_1 = require("../socket");
const server_1 = require("../server");
exports.sendMessageController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiverId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    let chat = yield chatService.findChat(receiverId, userId);
    if (!chat) {
        const payload = {
            participants: [receiverId, userId],
            messages: [],
        };
        chat = yield chatService.createChat(payload);
    }
    const msgPayload = {
        receiverId,
        senderId: userId,
        content,
        chatId: chat._id,
    };
    const newMessage = yield messageService.createMessage(msgPayload);
    chat.messages.push(newMessage._id);
    yield Promise.all([chat.save(), newMessage.save()]);
    const data = newMessage;
    const receiverSocketId = (0, socket_1.getReceiverId)(receiverId);
    if (receiverSocketId && server_1.io) {
        server_1.io.to(receiverSocketId).emit("newMessage", data);
    }
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.getMessagesController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;
    const data = yield chatService.findChatWithMessages(loggedInUserId, userId);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.getChatsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loggedInUserId = req.user._id;
    const data = yield chatService.getChatsWithLastMessages(loggedInUserId);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
