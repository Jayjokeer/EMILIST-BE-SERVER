"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatsWithLastMessages = exports.findChatWithMessages = exports.findChat = exports.createChat = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const error_1 = require("../errors/error");
const chat_model_1 = __importDefault(require("../models/chat.model"));
const createChat = async (data) => {
    return chat_model_1.default.create(data);
};
exports.createChat = createChat;
const findChat = async (recieverId, senderId) => {
    return chat_model_1.default.findOne({
        participants: { $all: [recieverId, senderId] }
    });
};
exports.findChat = findChat;
const findChatWithMessages = async (recieverId, senderId) => {
    return chat_model_1.default.findOne({
        participants: { $all: [recieverId, senderId] }
    }).populate('messages');
};
exports.findChatWithMessages = findChatWithMessages;
const getChatsWithLastMessages = async (userId) => {
    try {
        const chats = await chat_model_1.default.aggregate([
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
                _id: p._id,
            })),
            lastMessage: chat.lastMessage,
        }));
    }
    catch (error) {
        console.error(error);
        throw new error_1.NotFoundError("Error fetching chats with last messages");
    }
};
exports.getChatsWithLastMessages = getChatsWithLastMessages;
