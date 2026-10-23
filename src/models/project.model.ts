import mongoose, { Document, Schema } from 'mongoose';
import { CounterOfferRoleEnum, CounterOfferStatusEnum, ProjectStatusEnum, QuoteStatusEnum } from '../enums/project.enum';
import { IProject } from '../interfaces/project.interface';
const MilestoneSchema = new mongoose.Schema({
  milestoneId: { type: String, required: true },
  amount: { type: Number, required: true },
  achievement: { type: String, required: true },
});

const QuoteSchema = new mongoose.Schema({
  totalAmount: {type: Number},
  acceptedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  postedAt: {
    type: Date,
  },
  milestones: { type: [MilestoneSchema] },
  status: {type: String,enum: QuoteStatusEnum, default: QuoteStatusEnum.pending }
});

const BiddableDetailsSchema = new mongoose.Schema({
  maximumPrice: { type: Number, required: true },
  milestones: { type: [MilestoneSchema], required: true },
}, { _id: false });

const CounterOfferSchema = new mongoose.Schema({
  madeBy: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  madeByRole: { type: String, enum: CounterOfferRoleEnum, required: true },
  maximumPrice: { type: Number, required: true },
  milestones: { type: [MilestoneSchema], required: true },
  message: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: CounterOfferStatusEnum,
    default: CounterOfferStatusEnum.pending,
  },
  respondedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const projectSchema: Schema = new mongoose.Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Jobs',  
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Users',  
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Users',  
      required: true,
    },
    status: {
      type: String,
      enum: ProjectStatusEnum,
      default: ProjectStatusEnum.applied, 
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    directJobStatus: {
      type: String,
      enum: ProjectStatusEnum,
    },
    biddableDetails: { type: BiddableDetailsSchema },
    initialBiddableDetails: { type: BiddableDetailsSchema },
    counterOffers: { type: [CounterOfferSchema], default: [] },
    quote: {
      type: QuoteSchema,
    },
    businessId: {type: Schema.Types.ObjectId,
    ref: 'Business',  }
  
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
