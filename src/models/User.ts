
import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['STUDENT', 'OFFICER', 'COMPANY', 'SUPER_ADMIN'],
      default: 'STUDENT',
    },

    rollNumber: String,
    department: String,
    graduationYear: Number,
    cgpa: Number,

    backlogs: {
      type: Number,
      default: 0,
    },

    phone: String,
    resumeUrl: String,
    companyName: String,

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.User || model('User', UserSchema);
