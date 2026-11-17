"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markChatAsRead = exports.getChatsWithLastMessages = exports.findChatWithMessages = exports.findChat = exports.createChat = exports.escapeSearchPattern = exports.normalizePagination = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const chat_model_1 = __importDefault(require("../models/chat.model"));
const message_model_1 = __importDefault(require("../models/message.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const normalizePagination = ({ page = 1, limit = 20 } = {}) => {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return { page: normalizedPage, limit: normalizedLimit, skip: (normalizedPage - 1) * normalizedLimit };
};
exports.normalizePagination = normalizePagination;
const escapeSearchPattern = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
exports.escapeSearchPattern = escapeSearchPattern;
const objectId = (value, label) => {
    if (!mongoose_1.Types.ObjectId.isValid(value))
        throw new error_1.BadRequestError(`${label} is invalid`);
    return new mongoose_1.Types.ObjectId(value);
};
const participantProjection = "firstName lastName userName email displayImage";
const serializeParticipant = (participant) => {
    if (!participant)
        return null;
    const firstName = participant.firstName || "";
    const lastName = participant.lastName || "";
    return {
        _id: participant._id,
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(" ") || participant.userName || participant.email,
        userName: participant.userName,
        email: participant.email,
        displayImage: participant.displayImage,
        profileImage: participant.displayImage,
    };
};
const createChat = async (data) => chat_model_1.default.create(data);
exports.createChat = createChat;
const findChat = async (receiverId, senderId) => chat_model_1.default.findOne({
    participants: { $all: [objectId(receiverId, "Receiver ID"), objectId(senderId, "Sender ID")] },
});
exports.findChat = findChat;
const findChatWithMessages = async (loggedInUserId, otherUserId, pagination = {}) => {
    const currentUserObjectId = objectId(loggedInUserId, "User ID");
    const otherUserObjectId = objectId(otherUserId, "User ID");
    const { page, limit, skip } = (0, exports.normalizePagination)(pagination);
    const participant = await users_model_1.default.findById(otherUserObjectId).select(participantProjection).lean();
    if (!participant)
        throw new error_1.NotFoundError("User not found");
    const chat = await chat_model_1.default.findOne({ participants: { $all: [currentUserObjectId, otherUserObjectId] } }).lean();
    if (!chat) {
        return {
            chatId: null,
            participant: serializeParticipant(participant),
            messages: [],
            currentPage: page,
            totalPages: 0,
            totalMessages: 0,
            limit,
        };
    }
    const [messagesDescending, totalMessages] = await Promise.all([
        message_model_1.default.find({ chatId: chat._id }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        message_model_1.default.countDocuments({ chatId: chat._id }),
    ]);
    return {
        chatId: chat._id,
        participant: serializeParticipant(participant),
        messages: messagesDescending.reverse(),
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        limit,
    };
};
exports.findChatWithMessages = findChatWithMessages;
const getChatsWithLastMessages = async (userId, pagination = {}, search = "") => {
    const currentUserId = objectId(userId, "User ID");
    const { page, limit, skip } = (0, exports.normalizePagination)(pagination);
    const trimmedSearch = search.trim().slice(0, 100);
    const searchRegex = trimmedSearch ? new RegExp((0, exports.escapeSearchPattern)(trimmedSearch), "i") : null;
    const pipeline = [
        { $match: { participants: currentUserId } },
        {
            $lookup: {
                from: "users",
                let: { participantIds: "$participants" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $in: ["$_id", "$$participantIds"] }, { $ne: ["$_id", currentUserId] }] } } },
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            userName: 1,
                            email: 1,
                            displayImage: 1,
                            profileImage: "$displayImage",
                            fullName: {
                                $let: {
                                    vars: { joinedName: { $trim: { input: { $concat: [{ $ifNull: ["$firstName", ""] }, " ", { $ifNull: ["$lastName", ""] }] } } } },
                                    in: { $cond: [{ $ne: ["$$joinedName", ""] }, "$$joinedName", { $ifNull: ["$userName", "$email"] }] },
                                },
                            },
                        },
                    },
                ],
                as: "participants",
            },
        },
        { $set: { participant: { $arrayElemAt: ["$participants", 0] } } },
    ];
    if (searchRegex) {
        pipeline.push({
            $match: {
                $or: [
                    { "participant.fullName": searchRegex },
                    { "participant.userName": searchRegex },
                    { "participant.email": searchRegex },
                ],
            },
        });
    }
    pipeline.push({
        $lookup: {
            from: "messages",
            let: { chatId: "$_id" },
            pipeline: [
                { $match: { $expr: { $eq: ["$chatId", "$$chatId"] } } },
                { $sort: { createdAt: -1, _id: -1 } },
                { $limit: 1 },
            ],
            as: "lastMessages",
        },
    }, {
        $lookup: {
            from: "messages",
            let: { chatId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$chatId", "$$chatId"] },
                                { $eq: ["$receiverId", currentUserId] },
                                { $eq: [{ $ifNull: ["$readAt", null] }, null] },
                            ],
                        },
                    },
                },
                { $count: "count" },
            ],
            as: "unreadMessages",
        },
    }, {
        $set: {
            lastMessage: { $arrayElemAt: ["$lastMessages", 0] },
            unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadMessages.count", 0] }, 0] },
        },
    }, { $sort: { "lastMessage.createdAt": -1, updatedAt: -1, _id: -1 } }, {
        $facet: {
            conversations: [
                { $skip: skip },
                { $limit: limit },
                { $project: { chatId: "$_id", _id: 0, participant: 1, participants: 1, lastMessage: 1, unreadCount: 1, createdAt: 1, updatedAt: 1 } },
            ],
            metadata: [{ $count: "total" }],
        },
    });
    const [result, unreadCount] = await Promise.all([
        chat_model_1.default.aggregate(pipeline),
        message_model_1.default.countDocuments({ receiverId: currentUserId, readAt: null }),
    ]);
    const conversations = result[0]?.conversations || [];
    const totalConversations = result[0]?.metadata[0]?.total || 0;
    return {
        conversations,
        unreadCount,
        currentPage: page,
        totalPages: Math.ceil(totalConversations / limit),
        totalConversations,
        limit,
    };
};
exports.getChatsWithLastMessages = getChatsWithLastMessages;
const markChatAsRead = async (chatId, userId) => {
    const chatObjectId = objectId(chatId, "Chat ID");
    const userObjectId = objectId(userId, "User ID");
    const chat = await chat_model_1.default.findOne({ _id: chatObjectId, participants: userObjectId }).lean();
    if (!chat)
        throw new error_1.NotFoundError("Conversation not found");
    const unreadMessages = await message_model_1.default.find({ chatId: chatObjectId, receiverId: userObjectId, readAt: null })
        .select("_id senderId")
        .lean();
    const readAt = new Date();
    if (unreadMessages.length > 0) {
        await message_model_1.default.updateMany({ _id: { $in: unreadMessages.map(message => message._id) } }, { $set: { readAt } });
    }
    const otherParticipantId = chat.participants.find(participant => String(participant) !== String(userObjectId));
    return {
        chatId: chat._id,
        readAt,
        markedCount: unreadMessages.length,
        messageIds: unreadMessages.map(message => String(message._id)),
        senderId: otherParticipantId ? String(otherParticipantId) : null,
    };
};
exports.markChatAsRead = markChatAsRead;
