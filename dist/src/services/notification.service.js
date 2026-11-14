"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markNotificationAsRead = exports.fetchUserNotifications = exports.findNotificationById = exports.createNotification = exports.normalizeNotification = exports.safeNotificationMessage = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const notification_enum_1 = require("../enums/notification.enum");
const notificationTypes = new Set(Object.values(notification_enum_1.NotificationTypeEnum));
const notificationLevels = new Set(Object.values(notification_enum_1.NotificationLevelEnum));
const safeNotificationText = (value, fallback) => {
    const text = value === undefined || value === null ? "" : String(value).trim();
    if (!text)
        return fallback;
    return text.replace(/\b(?:undefined|null|NaN)\b/gi, "unavailable");
};
// Legacy notifications sometimes stored an unresolved actor name directly in
// the message (for example, "undefined applied to your job"). The actor can no
// longer be recovered from those records, so return a readable neutral name.
const safeNotificationMessage = (value) => {
    const text = value === undefined || value === null ? "" : String(value).trim();
    if (!text)
        return "You have a new update on Emilist.";
    return text
        .replace(/\b(?:undefined|null|NaN)\b(?=\s+(?:accepted|applied|cancelled|countered|declined|messaged|paused|rejected|sent|unpaused|updated)\b)/gi, "An Emilist user")
        .replace(/\b(?:undefined|null|NaN)\b/gi, "unavailable");
};
exports.safeNotificationMessage = safeNotificationMessage;
const inferNotificationType = (notification) => {
    const currentType = String(notification?.type || "");
    if (notificationTypes.has(currentType))
        return currentType;
    const content = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
    if (/job|application|counteroffer|quote/.test(content))
        return notification_enum_1.NotificationTypeEnum.job;
    if (/message|messaged|chat/.test(content))
        return notification_enum_1.NotificationTypeEnum.message;
    if (/material|product/.test(content))
        return notification_enum_1.NotificationTypeEnum.material;
    if (/expert/.test(content))
        return notification_enum_1.NotificationTypeEnum.expert;
    if (/support|ticket/.test(content))
        return notification_enum_1.NotificationTypeEnum.support;
    if (/wallet|withdraw|fund/.test(content))
        return notification_enum_1.NotificationTypeEnum.wallet;
    if (/payment|invoice|transaction/.test(content))
        return notification_enum_1.NotificationTypeEnum.payment;
    if (/order|delivery/.test(content))
        return notification_enum_1.NotificationTypeEnum.order;
    if (/subscription|plan/.test(content))
        return notification_enum_1.NotificationTypeEnum.subscription;
    if (/password|account|profile|verification/.test(content))
        return notification_enum_1.NotificationTypeEnum.account;
    return notification_enum_1.NotificationTypeEnum.system;
};
const inferResourceId = (notification) => {
    if (notification?.resourceId)
        return String(notification.resourceId);
    const metadata = notification?.metadata || {};
    const metadataId = metadata.jobId || metadata.chatId || metadata.materialId || metadata.expertId ||
        metadata.supportRequestId || metadata.walletId || metadata.paymentId || metadata.orderId ||
        metadata.subscriptionId || metadata.userId;
    if (metadataId)
        return String(metadataId);
    const directId = String(notification?.message || "").match(/\bID:\s*([a-f\d]{24})\b/i)?.[1];
    return directId || null;
};
const attachDomainResourceId = (notification) => {
    const metadata = notification.metadata || {};
    const resourceId = notification.resourceId || null;
    const explicitIds = {
        [notification_enum_1.NotificationTypeEnum.job]: { field: "jobId", value: metadata.jobId || resourceId },
        [notification_enum_1.NotificationTypeEnum.message]: {
            field: "chatId",
            value: metadata.chatId || (notification.action === "new_message" ? resourceId : null),
        },
        [notification_enum_1.NotificationTypeEnum.material]: { field: "materialId", value: metadata.materialId || resourceId },
        [notification_enum_1.NotificationTypeEnum.expert]: { field: "expertId", value: metadata.expertId || resourceId },
        [notification_enum_1.NotificationTypeEnum.support]: { field: "supportRequestId", value: metadata.supportRequestId || resourceId },
        [notification_enum_1.NotificationTypeEnum.account]: { field: "userId", value: metadata.userId || resourceId },
        [notification_enum_1.NotificationTypeEnum.wallet]: { field: "walletId", value: metadata.walletId || resourceId },
        [notification_enum_1.NotificationTypeEnum.payment]: { field: "paymentId", value: metadata.paymentId || resourceId },
        [notification_enum_1.NotificationTypeEnum.order]: { field: "orderId", value: metadata.orderId || resourceId },
        [notification_enum_1.NotificationTypeEnum.subscription]: { field: "subscriptionId", value: metadata.subscriptionId || resourceId },
    };
    const mapping = explicitIds[notification.type];
    if (!mapping)
        return { id: resourceId, field: null };
    const id = mapping.value ? String(mapping.value) : null;
    notification[mapping.field] = id;
    return { id, field: mapping.field };
};
const normalizeNotification = (notification) => {
    const normalized = typeof notification?.toObject === "function"
        ? notification.toObject()
        : { ...notification };
    normalized.title = safeNotificationText(normalized.title, "Emilist notification");
    normalized.message = (0, exports.safeNotificationMessage)(normalized.message);
    const legacyLevel = notificationLevels.has(String(normalized.type))
        ? String(normalized.type)
        : undefined;
    normalized.type = inferNotificationType(normalized);
    normalized.level = notificationLevels.has(String(normalized.level))
        ? normalized.level
        : legacyLevel || notification_enum_1.NotificationLevelEnum.info;
    normalized.resourceId = inferResourceId(normalized);
    normalized.action = normalized.action || null;
    normalized.metadata = normalized.metadata || {};
    const domainResource = attachDomainResourceId(normalized);
    normalized.target = {
        type: normalized.type,
        id: domainResource.id,
        idField: domainResource.field,
        action: normalized.action,
    };
    return normalized;
};
exports.normalizeNotification = normalizeNotification;
const repairLegacyNotifications = async (notifications) => {
    const repairs = notifications.flatMap((notification) => {
        const normalized = (0, exports.normalizeNotification)(notification);
        if (normalized.title === notification.title &&
            normalized.message === notification.message &&
            normalized.type === notification.type &&
            normalized.level === notification.level &&
            normalized.resourceId === (notification.resourceId ? String(notification.resourceId) : null))
            return [];
        return [{
                updateOne: {
                    filter: { _id: notification._id },
                    update: { $set: {
                            title: normalized.title,
                            message: normalized.message,
                            type: normalized.type,
                            level: normalized.level,
                            resourceId: normalized.resourceId,
                            action: normalized.action,
                            metadata: normalized.metadata,
                        } },
                },
            }];
    });
    if (repairs.length)
        await notification_model_1.default.bulkWrite(repairs);
};
const createNotification = async (data) => {
    const notification = await notification_model_1.default.create({
        ...data,
        title: safeNotificationText(data?.title, "Emilist notification"),
        message: (0, exports.safeNotificationMessage)(data?.message),
        type: inferNotificationType(data),
        level: notificationLevels.has(String(data?.level))
            ? data.level
            : notification_enum_1.NotificationLevelEnum.info,
        resourceId: inferResourceId(data),
        action: data?.action || null,
        metadata: data?.metadata || {},
    });
    return (0, exports.normalizeNotification)(notification);
};
exports.createNotification = createNotification;
const findNotificationById = async (id) => {
    const notification = await notification_model_1.default.findById(id);
    if (!notification)
        return null;
    await repairLegacyNotifications([notification]);
    return (0, exports.normalizeNotification)(notification);
};
exports.findNotificationById = findNotificationById;
const fetchUserNotifications = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [notifications, totalNotifications, unreadCount] = await Promise.all([
        notification_model_1.default.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        notification_model_1.default.countDocuments({ userId }),
        notification_model_1.default.countDocuments({ userId, isRead: false }),
    ]);
    await repairLegacyNotifications(notifications);
    return {
        notifications: notifications.map(exports.normalizeNotification),
        unreadCount,
        totalPages: Math.ceil(totalNotifications / limit),
        currentPage: page,
        totalNotifications,
    };
};
exports.fetchUserNotifications = fetchUserNotifications;
const markNotificationAsRead = async (notificationId) => {
    const notification = await notification_model_1.default.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    if (!notification)
        return null;
    await repairLegacyNotifications([notification]);
    return (0, exports.normalizeNotification)(notification);
};
exports.markNotificationAsRead = markNotificationAsRead;
const deleteNotification = async (notificationId) => {
    return await notification_model_1.default.findByIdAndDelete(notificationId);
};
exports.deleteNotification = deleteNotification;
