
import { Schema, models, model } from 'mongoose';

const StudentProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    fullName: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    graduationYear: { type: Number, min: 2020, max: 2100 },
    cgpa: { type: Number, min: 0, max: 10 },
    activeBacklogs: { type: Number, min: 0, default: 0 },
    historicalBacklogs: { type: Number, min: 0, default: 0 },

    tenth: {
      board: String,
      year: Number,
      percentage: { type: Number, min: 0, max: 100 },
    },

    twelfth: {
      board: String,
      year: Number,
      percentage: { type: Number, min: 0, max: 100 },
    },

    // Student document-sharing links
    tenthMarksheetUrl: {
      type: String,
      trim: true,
      default: '',
    },

    twelfthMarksheetUrl: {
      type: String,
      trim: true,
      default: '',
    },

    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },

    verificationStatus: {
      type: String,
      enum: [
        'PENDING_VERIFICATION',
        'VERIFIED',
        'REJECTED',
        'INACTIVE',
      ],
      default: 'PENDING_VERIFICATION',
    },

    placementStatus: {
      type: String,
      enum: ['ACTIVE_PLACEMENT', 'PLACED'],
      default: 'ACTIVE_PLACEMENT',
    },

    rejectionReason: String,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,

    profileLocked: { type: Boolean, default: false },
    profileEditAllowed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.StudentProfile ||
  model('StudentProfile', StudentProfileSchema);
