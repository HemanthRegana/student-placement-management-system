import mongoose, { Schema, models, model } from 'mongoose';
const ApplicationSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true }, job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['APPLIED','SHORTLISTED','INTERVIEW','SELECTED','REJECTED'], default: 'APPLIED' }, notes: String
}, { timestamps: true });
ApplicationSchema.index({ student: 1, job: 1 }, { unique: true });
export default models.Application || model('Application', ApplicationSchema);
