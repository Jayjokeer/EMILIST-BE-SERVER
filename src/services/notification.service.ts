import Notification from "../models/notification.model";

export const createNotification = async(data: any)=>{
    return await Notification.create(data);
};
export const findNotificationById = async(id: string)=>{
    return await Notification.findById(id);
};
export const fetchUserNotifications = async(userId: string, page = 1, limit = 10)=>{
    const skip = (page - 1) * limit;

    const [notifications, totalNotifications, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      totalNotifications,
    };
};
export const markNotificationAsRead = async(notificationId: string)=>{
    return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};
export const deleteNotification = async(notificationId: string)=>{
    return await Notification.findByIdAndDelete(notificationId);
};