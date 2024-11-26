import mongoose, { Schema, model, Document } from 'mongoose';
import { INotification } from '../interfaces/notification.interface';
import { NotificationTypeEnum } from '../enums/notification.enum';


const notificationSchema = new mongoose.Schema(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'Users'},
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: NotificationTypeEnum,
      default: NotificationTypeEnum.info,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', notificationSchema);
