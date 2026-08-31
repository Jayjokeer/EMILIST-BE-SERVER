import mongoose, { Document, Schema } from 'mongoose';
import { JobExpertLevel, JobPeriod, JobType, MilestoneEnum, MilestonePaymentStatus, JobStatusEnum, RatingEnum, JobUrgencyEnum, JobFrequencyEnum, DurationUnitEnum, ExperienceLevelEnum } from '../enums/jobs.enum';
import { IJob, IMilestone } from '../interfaces/jobs.interface';
import { PaymentMethodEnum } from '../enums/transaction.enum';

const MilestoneSchema = new Schema<IMilestone>({
    timeFrame: {
      number: {type: String},
      period: {type: String},
    },
    achievement: {
      type: String,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
    },
    status:{
      type: String,
      enum: MilestoneEnum,
      default: MilestoneEnum.pending
    },
    paymentStatus: {
      type: String,
      enum: MilestonePaymentStatus,
      default:  MilestonePaymentStatus.unpaid,
    },
    paymentInfo: {
      amountPaid:{type: Number},
      paymentMethod: {type: String, enum: PaymentMethodEnum},
      date: {type: Date},
      paymentReciept: {type: String },
      note: {type: String },
    },
    datePaid: {
      type: Date
    },
    invoice: {
      note: {type: String},
      additionalAmount: {type: Number, default: 0},
      invoiceRaised: {type: Boolean, default: false}
      }
  });

// ===== NEW SUB-SCHEMAS FOR REWORK =====
const LocationSchema = new Schema({
  address: { type: String },
  lat: { type: Number },
  lng: { type: Number },
}, { _id: false });

const JobScheduleSchema = new Schema({
  startDate: { type: Date },
  endDate: { type: Date },
}, { _id: false });

const BudgetSchema = new Schema({
  currency: { type: String },
  amount: { type: Number },
}, { _id: false });

const RecurringBudgetSchema = new Schema({
  currency: { type: String },
  amount: { type: Number },
  period: { type: String, enum: JobFrequencyEnum },
}, { _id: false });

const JobDurationSchema = new Schema({
  value: { type: Number },
  unit: { type: String, enum: DurationUnitEnum },
}, { _id: false });

const jobSchema: Schema = new mongoose.Schema(
  {
    // ===== EXISTING FIELDS (RETAINED) =====
    category: { type: String},
    service: { type: String},
    title: { type: String },
    description: { type: String },
    jobFiles:[
      {
        id: { type: Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
        url: { type: String },
      }
    ],
    duration: {
         number: {type: Number},
         period: {type: String, enum: JobPeriod},
        },
    type: {type: String, enum: JobType},
    budget: {type: Number},
    location: {type: Schema.Types.Mixed},  // mixed: string (old) or object (new)
    expertLevel: {type: String, enum: JobExpertLevel},
    milestones: {
        type: [MilestoneSchema],
        validate: {
          validator: (value: IMilestone[]) => value.length <= 5,
          message: 'Cannot have more than 5 milestones.',
        },
      },
    maximumPrice: {type: Number},
    bidRange: {type: Number},
    achievementDetails: {type: String},
    currency: {type: String},
    status: {
      type: String,
      enum: JobStatusEnum,
      default: JobStatusEnum.pending, 
    },
    userId: {type: Schema.Types.ObjectId, ref: 'Users'},
    applications: [ {type: Schema.Types.ObjectId, ref: 'Project'}  ],
    acceptedApplicationId: {type: Schema.Types.ObjectId, ref: 'Project'},
    additionalAmount: {type: Number},
    startDate: { type: Date }, 
    endDate: { type: Date },
    isRequestForQuote: {type: Boolean, default: false },
    pausedDate: {type: Date},
    isClosed: {type: Boolean, default: false },
    review: {
      rating: {type: String, enum: RatingEnum},
      note: {type: String},
      rateCommunication: {type: String, enum: RatingEnum},
      isRecommendVendor:{type: String },
    },
    clicks: {
      users: [{type: Schema.Types.ObjectId, ref: 'Users'}],
      clickCount: {type: Number, default: 0}
     },

    // ===== NEW FIELDS FOR REWORK =====
    jobUrgency: { type: String, enum: JobUrgencyEnum },
    jobCategory: { type: String },
    images: [{ type: String }],
    allowBidding: { type: Boolean },
    experienceLevel: { type: String, enum: ExperienceLevelEnum },
    expertId: { type: String },
    isDirectHire: { type: Boolean, default: false },
    isListed: { type: Boolean, default: true },

    // Urgency-specific nested objects
    jobFrequency: { type: String, enum: JobFrequencyEnum },
    recurringBudget: { type: RecurringBudgetSchema },

    jobSchedule: { type: JobScheduleSchema },
    estimatedBudget: { type: BudgetSchema },

    jobDuration: { type: JobDurationSchema },
    totalBudget: { type: BudgetSchema },
      },
  { timestamps: true }

);

// ===== BACKWARD-COMPATIBILITY MIDDLEWARE =====
// On find, populate new fields from old data if missing
jobSchema.pre('find', function() {
  // This is a read-side transform; we handle it in toObject/toJSON instead
});

jobSchema.pre('save', function(next) {
  const job = this as any;

  // Map old category -> jobCategory if jobCategory not set
  if (!job.jobCategory && job.category) {
    job.jobCategory = job.category;
  }

  // Map old expertLevel (one/two/three/four) -> experienceLevel if not set
  if (!job.experienceLevel && job.expertLevel) {
    const levelMap: Record<string, string> = {
      one: 'apprentice',
      two: 'junior',
      three: 'intermediate',
      four: 'senior',
    };
    job.experienceLevel = levelMap[job.expertLevel] || job.expertLevel;
  }

  // Map old location (string) -> new location object if location is a string
  if (typeof job.location === 'string' && !job.location?.address) {
    job.location = { address: job.location };
  }

  // If jobUrgency is set, sanitize fields that don't belong
  if (job.jobUrgency) {
    if (job.jobUrgency === JobUrgencyEnum.right_now) {
      job.jobFrequency = undefined;
      job.recurringBudget = undefined;
      job.jobSchedule = undefined;
      job.estimatedBudget = undefined;
      job.startDate = undefined;
      job.endDate = undefined;
    } else if (job.jobUrgency === JobUrgencyEnum.in_future) {
      job.jobFrequency = undefined;
      job.recurringBudget = undefined;
      job.jobDuration = undefined;
      job.totalBudget = undefined;
    } else if (job.jobUrgency === JobUrgencyEnum.regularly) {
      job.jobSchedule = undefined;
      job.estimatedBudget = undefined;
      job.jobDuration = undefined;
      job.totalBudget = undefined;
    }
  }

  next();
});

/**
 * Transform the document for serialization:
 * - Hide raw conditional fields that don't match jobUrgency
 * - Keep backward-compat fields for old records
 */
jobSchema.set('toJSON', {
  transform: function(_doc: any, ret: any) {
    // Backward-compat: ensure location is an object if it's a string
    if (typeof ret.location === 'string') {
      ret.location = { address: ret.location };
    }
    // Backward-compat: map expertLevel if experienceLevel is missing
    if (!ret.experienceLevel && ret.expertLevel) {
      const levelMap: Record<string, string> = {
        one: 'apprentice',
        two: 'junior',
        three: 'intermediate',
        four: 'senior',
      };
      ret.experienceLevel = levelMap[ret.expertLevel] || ret.expertLevel;
    }
    return ret;
  }
});

jobSchema.set('toObject', {
  transform: function(_doc: any, ret: any) {
    // same transform as toJSON
    if (typeof ret.location === 'string') {
      ret.location = { address: ret.location };
    }
    if (!ret.experienceLevel && ret.expertLevel) {
      const levelMap: Record<string, string> = {
        one: 'apprentice',
        two: 'junior',
        three: 'intermediate',
        four: 'senior',
      };
      ret.experienceLevel = levelMap[ret.expertLevel] || ret.expertLevel;
    }
    return ret;
  }
});

export default mongoose.model<IJob>('Jobs', jobSchema);