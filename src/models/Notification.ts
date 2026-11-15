
import mongoose, { Schema, models, model } from 'mongoose';

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: [
        'PROFILE_SUBMITTED',
        'PROFILE_VERIFIED',
        'PROFILE_REJECTED',
        'PROFILE_EDIT_ALLOWED',
        'NEW_PLACEMENT_DRIVE',
        'APPLICATION_SUBMITTED',
        'APPLICATION_SHORTLISTED',
        'APPLICATION_INTERVIEW',
        'APPLICATION_SELECTED',
        'APPLICATION_REJECTED',
        'STUDENT_REGISTERED',
        'SYSTEM',
      ],
      default: 'SYSTEM',
      required: true,
    },

    link: {
      type: String,
      default: '/dashboard',
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Efficiently retrieve a user's newest notifications.
NotificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

// Efficiently count unread notifications.
NotificationSchema.index({
  recipient: 1,
  isRead: 1,
});

const Notification =
  models.Notification ||
  model('Notification', NotificationSchema);

export default Notification;
