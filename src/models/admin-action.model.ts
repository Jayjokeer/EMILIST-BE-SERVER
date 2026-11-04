import mongoose, { Schema } from "mongoose";

const AdminActionSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
  targetUserId: { type: Schema.Types.ObjectId, ref: "Users", index: true },
  targetType: { type: String, enum: ["customer", "job", "product", "order", "transaction", "support_request"], default: "customer", index: true },
  targetId: { type: Schema.Types.ObjectId, index: true },
  action: { type: String, required: true, index: true },
  reason: { type: String, trim: true },
  context: { type: String, trim: true },
  previousState: { type: Schema.Types.Mixed },
  newState: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

AdminActionSchema.index({ targetUserId: 1, createdAt: -1 });
AdminActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("AdminAction", AdminActionSchema);
