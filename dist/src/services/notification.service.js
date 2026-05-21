"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.fetchUserNotifications = exports.findNotificationById = exports.createNotification = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const createNotification = async (data) => {
    return await notification_model_1.default.create(data);
};
exports.createNotification = createNotification;
const findNotificationById = async (id) => {
    return await notification_model_1.default.findById(id);
};
exports.findNotificationById = findNotificationById;
const fetchUserNotifications = async (userId) => {
    return await notification_model_1.default.find({ userId: userId });
};
exports.fetchUserNotifications = fetchUserNotifications;
const deleteNotification = async (notificationId) => {
    return await notification_model_1.default.findByIdAndDelete(notificationId);
};
exports.deleteNotification = deleteNotification;
