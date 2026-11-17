import mongoose, { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/error";
import { IChat } from "../interfaces/chat.interface";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import Users from "../models/users.model";

export interface PaginationOptions {
  page?: string | number;
  limit?: string | number;
}

export const normalizePagination = ({ page = 1, limit = 20 }: PaginationOptions = {}) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: normalizedPage, limit: normalizedLimit, skip: (normalizedPage - 1) * normalizedLimit };
};

export const escapeSearchPattern = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const objectId = (value: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestError(`${label} is invalid`);
  return new Types.ObjectId(value);
};

const participantProjection = "firstName lastName userName email displayImage";

const serializeParticipant = (participant: any) => {
  if (!participant) return null;
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

export const createChat = async (data: IChat) => Chat.create(data);

export const findChat = async (receiverId: string, senderId: string) => Chat.findOne({
  participants: { $all: [objectId(receiverId, "Receiver ID"), objectId(senderId, "Sender ID")] },
});

export const findChatWithMessages = async (
  loggedInUserId: string,
  otherUserId: string,
  pagination: PaginationOptions = {},
) => {
  const currentUserObjectId = objectId(loggedInUserId, "User ID");
  const otherUserObjectId = objectId(otherUserId, "User ID");
  const { page, limit, skip } = normalizePagination(pagination);

  const participant = await Users.findById(otherUserObjectId).select(participantProjection).lean();
  if (!participant) throw new NotFoundError("User not found");

  const chat = await Chat.findOne({ participants: { $all: [currentUserObjectId, otherUserObjectId] } }).lean();
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
    Message.find({ chatId: chat._id }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments({ chatId: chat._id }),
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

export const getChatsWithLastMessages = async (
  userId: string,
  pagination: PaginationOptions = {},
  search = "",
) => {
  const currentUserId = objectId(userId, "User ID");
  const { page, limit, skip } = normalizePagination(pagination);
  const trimmedSearch = search.trim().slice(0, 100);
  const searchRegex = trimmedSearch ? new RegExp(escapeSearchPattern(trimmedSearch), "i") : null;

  const pipeline: mongoose.PipelineStage[] = [
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

  pipeline.push(
    {
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
    },
    {
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
    },
    {
      $set: {
        lastMessage: { $arrayElemAt: ["$lastMessages", 0] },
        unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadMessages.count", 0] }, 0] },
      },
    },
    { $sort: { "lastMessage.createdAt": -1, updatedAt: -1, _id: -1 } },
    {
      $facet: {
        conversations: [
          { $skip: skip },
          { $limit: limit },
          { $project: { chatId: "$_id", _id: 0, participant: 1, participants: 1, lastMessage: 1, unreadCount: 1, createdAt: 1, updatedAt: 1 } },
        ],
        metadata: [{ $count: "total" }],
      },
    },
  );

  const [result, unreadCount] = await Promise.all([
    Chat.aggregate(pipeline),
    Message.countDocuments({ receiverId: currentUserId, readAt: null }),
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

export const markChatAsRead = async (chatId: string, userId: string) => {
  const chatObjectId = objectId(chatId, "Chat ID");
  const userObjectId = objectId(userId, "User ID");
  const chat = await Chat.findOne({ _id: chatObjectId, participants: userObjectId }).lean();
  if (!chat) throw new NotFoundError("Conversation not found");

  const unreadMessages = await Message.find({ chatId: chatObjectId, receiverId: userObjectId, readAt: null })
    .select("_id senderId")
    .lean();
  const readAt = new Date();

  if (unreadMessages.length > 0) {
    await Message.updateMany(
      { _id: { $in: unreadMessages.map(message => message._id) } },
      { $set: { readAt } },
    );
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
