import { Document } from 'mongoose';
import { NotificationTypeEnum } from '../enums/notification.enum';

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeEnum
  isRead: boolean;
//   metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
