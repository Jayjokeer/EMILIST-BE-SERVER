import { Document } from 'mongoose';
import { NotificationLevelEnum, NotificationTypeEnum } from '../enums/notification.enum';

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeEnum;
  level: NotificationLevelEnum;
  resourceId?: string | null;
  action?: string | null;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
