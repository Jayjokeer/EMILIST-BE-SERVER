import mongoose, { Schema } from "mongoose";
import { SupportRequestCategory, SupportRequestPriority, SupportRequestStatus } from "../enums/support.enum";

const SupportHistorySchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
  action: { type: String, required: true },
  note: { type: String, trim: true },
  fromStatus: { type: String, enum: SupportRequestStatus },
  toStatus: { type: String, enum: SupportRequestStatus },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const SupportMessageSchema = new Schema({
  senderType: { type: String, enum: ["customer", "admin", "system"], required: true },
  senderUserId: { type: Schema.Types.ObjectId, ref: "Users" },
  senderAdminId: { type: Schema.Types.ObjectId, ref: "Admin" },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  attachments: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const SupportNoteSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const SupportRequestSchema = new Schema({
  requesterId: { type: Schema.Types.ObjectId, ref: "Users", required: true, index: true },
  ticketCode: { type: String, unique: true, sparse: true, index: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: SupportRequestCategory, default: SupportRequestCategory.other, index: true },
  priority: { type: String, enum: SupportRequestPriority, default: SupportRequestPriority.normal, index: true },
  status: { type: String, enum: SupportRequestStatus, default: SupportRequestStatus.open, index: true },
  linkedType: { type: String, enum: ["job", "customer", "listing", "payment", "order"] },
  linkedRecordId: { type: Schema.Types.ObjectId },
  assignedAdminId: { type: Schema.Types.ObjectId, ref: "Admin" },
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
  const request = this as any;
  if (!request.ticketCode && request._id) request.ticketCode = `TKT-${String(request._id).slice(-6).toUpperCase()}`;
});

SupportRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
SupportRequestSchema.index({ subject: "text", description: "text" });

export default mongoose.model("SupportRequest", SupportRequestSchema);
