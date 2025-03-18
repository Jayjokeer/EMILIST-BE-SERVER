import mongoose, { Document, Schema } from 'mongoose';
import { IRecurringJob } from '../interfaces/jobs.interface';
import { FrequencyEnum } from '../enums/jobs.enum';


const recurringJobSchema = new Schema<IRecurringJob>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Jobs', required: true },
  frequency: { type: String, enum: FrequencyEnum, required: true },
  nextMaintenanceDate: { type: Date, required: true },
  reminderDates: [{
    day: { type: Date },
    reminded: {type: Boolean, default: false}
}],
  startDate: { type: Date },                             
  endDate: { type: Date },
  childJobs: [{ type: Schema.Types.ObjectId, ref: 'Jobs' }],
}, { timestamps: true });

export default mongoose.model<IRecurringJob>('RecurringJob', recurringJobSchema);
