import Notification from "../models/notification.model";
import { NotificationLevelEnum, NotificationTypeEnum } from "../enums/notification.enum";

const notificationTypes = new Set(Object.values(NotificationTypeEnum));
const notificationLevels = new Set(Object.values(NotificationLevelEnum));

const safeNotificationText = (value: unknown, fallback: string) => {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!text) return fallback;
  return text.replace(/\b(?:undefined|null|NaN)\b/gi, "unavailable");
};

// Legacy notifications sometimes stored an unresolved actor name directly in
// the message (for example, "undefined applied to your job"). The actor can no
// longer be recovered from those records, so return a readable neutral name.
export const safeNotificationMessage = (value: unknown) => {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!text) return "You have a new update on Emilist.";

  return text
    .replace(
      /\b(?:undefined|null|NaN)\b(?=\s+(?:accepted|applied|cancelled|countered|declined|messaged|paused|rejected|sent|unpaused|updated)\b)/gi,
      "An Emilist user"
    )
    .replace(/\b(?:undefined|null|NaN)\b/gi, "unavailable");
};

const inferNotificationType = (notification: any): NotificationTypeEnum => {
  const currentType = String(notification?.type || "");
  if (notificationTypes.has(currentType as NotificationTypeEnum)) return currentType as NotificationTypeEnum;

  const content = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
  if (/job|application|counteroffer|quote/.test(content)) return NotificationTypeEnum.job;
  if (/message|messaged|chat/.test(content)) return NotificationTypeEnum.message;
  if (/material|product/.test(content)) return NotificationTypeEnum.material;
  if (/expert/.test(content)) return NotificationTypeEnum.expert;
  if (/support|ticket/.test(content)) return NotificationTypeEnum.support;
  if (/wallet|withdraw|fund/.test(content)) return NotificationTypeEnum.wallet;
  if (/payment|invoice|transaction/.test(content)) return NotificationTypeEnum.payment;
  if (/order|delivery/.test(content)) return NotificationTypeEnum.order;
  if (/subscription|plan/.test(content)) return NotificationTypeEnum.subscription;
  if (/password|account|profile|verification/.test(content)) return NotificationTypeEnum.account;
  return NotificationTypeEnum.system;
};

const inferResourceId = (notification: any) => {
  if (notification?.resourceId) return String(notification.resourceId);
  const metadata = notification?.metadata || {};
  const metadataId = metadata.jobId || metadata.chatId || metadata.materialId || metadata.expertId ||
    metadata.supportRequestId || metadata.walletId || metadata.paymentId || metadata.orderId ||
    metadata.subscriptionId || metadata.userId;
  if (metadataId) return String(metadataId);

  const directId = String(notification?.message || "").match(/\bID:\s*([a-f\d]{24})\b/i)?.[1];
  return directId || null;
};

export const normalizeNotification = (notification: any) => {
  const normalized = typeof notification?.toObject === "function"
    ? notification.toObject()
    : { ...notification };

  normalized.title = safeNotificationText(normalized.title, "Emilist notification");
  normalized.message = safeNotificationMessage(normalized.message);
  const legacyLevel = notificationLevels.has(String(normalized.type) as NotificationLevelEnum)
    ? String(normalized.type) as NotificationLevelEnum
    : undefined;
  normalized.type = inferNotificationType(normalized);
  normalized.level = notificationLevels.has(String(normalized.level) as NotificationLevelEnum)
    ? normalized.level
    : legacyLevel || NotificationLevelEnum.info;
  normalized.resourceId = inferResourceId(normalized);
  normalized.action = normalized.action || null;
  normalized.metadata = normalized.metadata || {};
  normalized.target = {
    type: normalized.type,
    id: normalized.resourceId,
    action: normalized.action,
  };
  return normalized;
};

const repairLegacyNotifications = async (notifications: any[]) => {
  const repairs = notifications.flatMap((notification: any) => {
    const normalized = normalizeNotification(notification);
    if (
      normalized.title === notification.title &&
      normalized.message === notification.message &&
      normalized.type === notification.type &&
      normalized.level === notification.level &&
      normalized.resourceId === (notification.resourceId ? String(notification.resourceId) : null)
    ) return [];

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

  if (repairs.length) await Notification.bulkWrite(repairs);
};

export const createNotification = async(data: any)=>{
    const notification = await Notification.create({
      ...data,
      title: safeNotificationText(data?.title, "Emilist notification"),
      message: safeNotificationMessage(data?.message),
      type: inferNotificationType(data),
      level: notificationLevels.has(String(data?.level) as NotificationLevelEnum)
        ? data.level
        : NotificationLevelEnum.info,
      resourceId: inferResourceId(data),
      action: data?.action || null,
      metadata: data?.metadata || {},
    });
    return normalizeNotification(notification);
};
export const findNotificationById = async(id: string)=>{
    const notification = await Notification.findById(id);
    if (!notification) return null;
    await repairLegacyNotifications([notification]);
    return normalizeNotification(notification);
};
export const fetchUserNotifications = async(userId: string, page = 1, limit = 10)=>{
    const skip = (page - 1) * limit;

    const [notifications, totalNotifications, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    await repairLegacyNotifications(notifications);

    return {
      notifications: notifications.map(normalizeNotification),
      unreadCount,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      totalNotifications,
    };
};
export const markNotificationAsRead = async(notificationId: string)=>{
    const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    if (!notification) return null;
    await repairLegacyNotifications([notification]);
    return normalizeNotification(notification);
};
export const deleteNotification = async(notificationId: string)=>{
    return await Notification.findByIdAndDelete(notificationId);
};
