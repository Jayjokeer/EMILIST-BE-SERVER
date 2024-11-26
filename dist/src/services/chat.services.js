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
const mongoose_1 = __importDefault(require("mongoose"));
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
        const chats = yield chat_model_1.default.aggregate([
            {
                $match: { participants: new mongoose_1.default.Types.ObjectId(userId) },
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
                            cond: { $ne: ["$$participant._id", new mongoose_1.default.Types.ObjectId(userId)] },
                        },
                    },
                    lastMessage: 1,
                },
            },
        ]);
        return chats.map((chat) => ({
            chatId: chat._id,
            participants: chat.participants.map((p) => ({
                fullName: p.fullName,
                profileImage: p.profileImage,
                email: p.email,
                userName: p.userName,
            })),
            lastMessage: chat.lastMessage,
        }));
    }
    catch (error) {
        console.error(error);
        throw new error_1.NotFoundError("Error fetching chats with last messages");
    }
});
exports.getChatsWithLastMessages = getChatsWithLastMessages;
