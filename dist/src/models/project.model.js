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
const project_enum_1 = require("../enums/project.enum");
const MilestoneSchema = new mongoose_1.default.Schema({
    milestoneId: { type: String, required: true },
    amount: { type: Number, required: true },
    achievement: { type: String, required: true },
});
const QuoteSchema = new mongoose_1.default.Schema({
    totalAmount: { type: Number },
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
    status: { type: String, enum: project_enum_1.QuoteStatusEnum, default: project_enum_1.QuoteStatusEnum.pending }
});
const projectSchema = new mongoose_1.default.Schema({
    job: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Jobs',
        required: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    status: {
        type: String,
        enum: project_enum_1.ProjectStatusEnum,
        default: project_enum_1.ProjectStatusEnum.pending,
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
        enum: project_enum_1.ProjectStatusEnum,
    },
    biddableDetails: {
        maximumPrice: { type: Number },
        milestones: [{
                milestoneId: { type: String },
                amount: { type: Number },
                achievement: { type: String },
            }],
    },
    quote: {
        type: QuoteSchema,
    },
    businessId: { type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Business', }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Project', projectSchema);
