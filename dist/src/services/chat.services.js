"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatsWithLastMessages = exports.findChatWithMessages = exports.findChat = exports.createChat = void 0;
const error_1 = require("../errors/error");
const chat_model_1 = __importDefault(require("../models/chat.model"));
const createChat = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return chat_model_1.default.create(data);
});
exports.createChat = createChat;
const findChat = (recieverId, senderId) => __awaiter(void 0, void 0, void 0, function* () {
    return chat_model_1.default.findOne({
        participants: { $all: [recieverId, senderId] }
    });
});
exports.findChat = findChat;
const findChatWithMessages = (recieverId, senderId) => __awaiter(void 0, void 0, void 0, function* () {
    return chat_model_1.default.findOne({
        participants: { $all: [recieverId, senderId] }
    }).populate('messages');
});
exports.findChatWithMessages = findChatWithMessages;
const getChatsWithLastMessages = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chats = yield chat_model_1.default.find({ participants: userId })
            .populate({
            path: 'messages',
            options: { sort: { createdAt: -1 }, limit: 1 },
        })
            .populate('participants', 'fullName profileImage email userName')
            .exec();
        console.log(chats);
        const chatList = chats.map((chat) => {
            const lastMessage = chat.messages[0] || null;
            return {
                chatId: chat._id,
                participants: chat.participants.filter((participant) => participant._id.toString() !== userId),
                lastMessage: lastMessage,
            };
        });
        return chatList;
    }
    catch (error) {
        console.log(error);
        throw new error_1.NotFoundError('Error fetching chats with last messages');
    }
});
exports.getChatsWithLastMessages = getChatsWithLastMessages;
