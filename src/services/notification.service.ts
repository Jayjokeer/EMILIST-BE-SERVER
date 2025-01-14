import Notification from "../models/notification.model";

export const createNotification = async(data: any)=>{
    return await Notification.create(data);
};
export const findNotificationById = async(id: string)=>{
    return await Notification.findById(id);
};
export const fetchUserNotifications = async(userId: string)=>{
    return await Notification.find({userId: userId});
};
export const deleteNotification = async(notificationId: string)=>{
    return await Notification.findByIdAndDelete(notificationId);
};