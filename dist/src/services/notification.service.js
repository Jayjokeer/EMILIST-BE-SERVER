"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markNotificationAsRead = exports.fetchUserNotifications = exports.findNotificationById = exports.createNotification = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const createNotification = async (data) => {
    return await notification_model_1.default.create(data);
};
exports.createNotification = createNotification;
const findNotificationById = async (id) => {
    return await notification_model_1.default.findById(id);
};
exports.findNotificationById = findNotificationById;
const fetchUserNotifications = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [notifications, totalNotifications, unreadCount] = await Promise.all([
        notification_model_1.default.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        notification_model_1.default.countDocuments({ userId }),
        notification_model_1.default.countDocuments({ userId, isRead: false }),
    ]);
    return {
        notifications,
        unreadCount,
        totalPages: Math.ceil(totalNotifications / limit),
        currentPage: page,
        totalNotifications,
    };
};
exports.fetchUserNotifications = fetchUserNotifications;
const markNotificationAsRead = async (notificationId) => {
    return await notification_model_1.default.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};
exports.markNotificationAsRead = markNotificationAsRead;
const deleteNotification = async (notificationId) => {
    return await notification_model_1.default.findByIdAndDelete(notificationId);
};
exports.deleteNotification = deleteNotification;
