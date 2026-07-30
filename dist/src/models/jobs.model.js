"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const jobs_enum_1 = require("../enums/jobs.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const MilestoneSchema = new mongoose_1.Schema({
    timeFrame: {
        number: { type: String },
        period: { type: String },
    },
    achievement: {
        type: String,
    },
    amount: {
        type: Number,
    },
    status: {
        type: String,
        enum: jobs_enum_1.MilestoneEnum,
        default: jobs_enum_1.MilestoneEnum.pending
    },
    paymentStatus: {
        type: String,
        enum: jobs_enum_1.MilestonePaymentStatus,
        default: jobs_enum_1.MilestonePaymentStatus.unpaid,
    },
    paymentInfo: {
        amountPaid: { type: Number },
        paymentMethod: { type: String, enum: transaction_enum_1.PaymentMethodEnum },
        date: { type: Date },
        paymentReciept: { type: String },
        note: { type: String },
    },
    datePaid: {
        type: Date
    },
    invoice: {
        note: { type: String },
        additionalAmount: { type: Number, default: 0 },
        invoiceRaised: { type: Boolean, default: false }
    }
});
// ===== NEW SUB-SCHEMAS FOR REWORK =====
const LocationSchema = new mongoose_1.Schema({
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
}, { _id: false });
const JobScheduleSchema = new mongoose_1.Schema({
    startDate: { type: Date },
    endDate: { type: Date },
}, { _id: false });
const BudgetSchema = new mongoose_1.Schema({
    currency: { type: String },
    amount: { type: Number },
}, { _id: false });
const RecurringBudgetSchema = new mongoose_1.Schema({
    currency: { type: String },
    amount: { type: Number },
    period: { type: String, enum: jobs_enum_1.JobFrequencyEnum },
}, { _id: false });
const JobDurationSchema = new mongoose_1.Schema({
    value: { type: Number },
    unit: { type: String, enum: jobs_enum_1.DurationUnitEnum },
}, { _id: false });
const jobSchema = new mongoose_1.default.Schema({
    // ===== EXISTING FIELDS (RETAINED) =====
    category: { type: String },
    service: { type: String },
    title: { type: String },
    description: { type: String },
    jobFiles: [
        {
            id: { type: mongoose_1.Schema.Types.ObjectId, default: new mongoose_1.default.Types.ObjectId() },
            url: { type: String },
        }
    ],
    duration: {
        number: { type: Number },
        period: { type: String, enum: jobs_enum_1.JobPeriod },
    },
    type: { type: String, enum: jobs_enum_1.JobType },
    budget: { type: Number },
    location: { type: mongoose_1.Schema.Types.Mixed }, // mixed: string (old) or object (new)
    expertLevel: { type: String, enum: jobs_enum_1.JobExpertLevel },
    milestones: {
        type: [MilestoneSchema],
        validate: {
            validator: (value) => value.length <= 5,
            message: 'Cannot have more than 5 milestones.',
        },
    },
    maximumPrice: { type: Number },
    bidRange: { type: Number },
    achievementDetails: { type: String },
    currency: { type: String },
    status: {
        type: String,
        enum: jobs_enum_1.JobStatusEnum,
        default: jobs_enum_1.JobStatusEnum.pending,
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Users' },
    applications: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' }],
    acceptedApplicationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    additionalAmount: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    isRequestForQuote: { type: Boolean, default: false },
    pausedDate: { type: Date },
    isClosed: { type: Boolean, default: false },
    review: {
        rating: { type: String, enum: jobs_enum_1.RatingEnum },
        note: { type: String },
        rateCommunication: { type: String, enum: jobs_enum_1.RatingEnum },
        isRecommendVendor: { type: String },
    },
    clicks: {
        users: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Users' }],
        clickCount: { type: Number, default: 0 }
    },
    // ===== NEW FIELDS FOR REWORK =====
    jobUrgency: { type: String, enum: jobs_enum_1.JobUrgencyEnum },
    jobCategory: { type: String },
    images: [{ type: String }],
    allowBidding: { type: Boolean },
    experienceLevel: { type: String, enum: jobs_enum_1.ExperienceLevelEnum },
    expertId: { type: String },
    isDirectHire: { type: Boolean, default: false },
    // Urgency-specific nested objects
    jobFrequency: { type: String, enum: jobs_enum_1.JobFrequencyEnum },
    recurringBudget: { type: RecurringBudgetSchema },
    jobSchedule: { type: JobScheduleSchema },
    estimatedBudget: { type: BudgetSchema },
    jobDuration: { type: JobDurationSchema },
    totalBudget: { type: BudgetSchema },
}, { timestamps: true });
// ===== BACKWARD-COMPATIBILITY MIDDLEWARE =====
// On find, populate new fields from old data if missing
jobSchema.pre('find', function () {
    // This is a read-side transform; we handle it in toObject/toJSON instead
});
jobSchema.pre('save', function (next) {
    const job = this;
    // Map old category -> jobCategory if jobCategory not set
    if (!job.jobCategory && job.category) {
        job.jobCategory = job.category;
    }
    // Map old expertLevel (one/two/three/four) -> experienceLevel if not set
    if (!job.experienceLevel && job.expertLevel) {
        const levelMap = {
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
        if (job.jobUrgency === jobs_enum_1.JobUrgencyEnum.right_now) {
            job.jobFrequency = undefined;
            job.recurringBudget = undefined;
            job.jobSchedule = undefined;
            job.estimatedBudget = undefined;
            job.startDate = undefined;
            job.endDate = undefined;
        }
        else if (job.jobUrgency === jobs_enum_1.JobUrgencyEnum.in_future) {
            job.jobFrequency = undefined;
            job.recurringBudget = undefined;
            job.jobDuration = undefined;
            job.totalBudget = undefined;
        }
        else if (job.jobUrgency === jobs_enum_1.JobUrgencyEnum.regularly) {
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
    transform: function (_doc, ret) {
        // Backward-compat: ensure location is an object if it's a string
        if (typeof ret.location === 'string') {
            ret.location = { address: ret.location };
        }
        // Backward-compat: map expertLevel if experienceLevel is missing
        if (!ret.experienceLevel && ret.expertLevel) {
            const levelMap = {
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
    transform: function (_doc, ret) {
        // same transform as toJSON
        if (typeof ret.location === 'string') {
            ret.location = { address: ret.location };
        }
        if (!ret.experienceLevel && ret.expertLevel) {
            const levelMap = {
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
exports.default = mongoose_1.default.model('Jobs', jobSchema);
