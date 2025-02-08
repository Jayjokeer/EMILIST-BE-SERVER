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
});
const jobSchema = new mongoose_1.default.Schema({
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
    location: { type: String },
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
}, { timestamps: true });
exports.default = mongoose_1.default.model('Jobs', jobSchema);
