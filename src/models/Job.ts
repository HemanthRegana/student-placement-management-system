import mongoose, { Schema, models, model } from 'mongoose';
const JobSchema = new Schema({
  title: { type: String, required: true }, companyName: { type: String, required: true }, description: { type: String, required: true }, location: String,
  packageLpa: { type: Number, required: true }, minCgpa: { type: Number, default: 0 }, maxBacklogs: { type: Number, default: 0 }, eligibleDepartments: [String], graduationYear: Number,
  deadline: { type: Date, required: true }, status: { type: String, enum: ['OPEN','CLOSED'], default: 'OPEN' }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
export default models.Job || model('Job', JobSchema);
