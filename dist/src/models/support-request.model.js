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
const support_enum_1 = require("../enums/support.enum");
const SupportHistorySchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    action: { type: String, required: true },
    note: { type: String, trim: true },
    fromStatus: { type: String, enum: support_enum_1.SupportRequestStatus },
    toStatus: { type: String, enum: support_enum_1.SupportRequestStatus },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });
const SupportMessageSchema = new mongoose_1.Schema({
    senderType: { type: String, enum: ["customer", "admin", "system"], required: true },
    senderUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Users" },
    senderAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: [{ type: String, trim: true }],
    createdAt: { type: Date, default: Date.now },
}, { _id: true });
const SupportNoteSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });
const SupportRequestSchema = new mongoose_1.Schema({
    requesterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    ticketCode: { type: String, unique: true, sparse: true, index: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: support_enum_1.SupportRequestCategory, default: support_enum_1.SupportRequestCategory.other, index: true },
    priority: { type: String, enum: support_enum_1.SupportRequestPriority, default: support_enum_1.SupportRequestPriority.normal, index: true },
    status: { type: String, enum: support_enum_1.SupportRequestStatus, default: support_enum_1.SupportRequestStatus.open, index: true },
    linkedType: { type: String, enum: ["job", "customer", "listing", "payment", "order"] },
    linkedRecordId: { type: mongoose_1.Schema.Types.ObjectId },
    assignedAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    assignedTeam: { type: String, trim: true, maxlength: 100 },
    escalatedAt: { type: Date },
    lastMessageAt: { type: Date },
    messages: { type: [SupportMessageSchema], default: [] },
    adminNotes: { type: [SupportNoteSchema], default: [] },
    resolvedAt: { type: Date },
    resolution: { type: String, trim: true },
    history: { type: [SupportHistorySchema], default: [] },
}, { timestamps: true });
SupportRequestSchema.pre("validate", function () {
    const request = this;
    if (!request.ticketCode && request._id)
        request.ticketCode = `TKT-${String(request._id).slice(-6).toUpperCase()}`;
});
SupportRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
SupportRequestSchema.index({ subject: "text", description: "text" });
exports.default = mongoose_1.default.model("SupportRequest", SupportRequestSchema);
