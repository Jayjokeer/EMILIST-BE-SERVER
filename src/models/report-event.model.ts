import mongoose, { Schema } from "mongoose";

export enum ReportEventType {
  impression = "impression",
  click = "click",
  share = "share",
  contact = "contact",
  invite = "invite",
}

const reportEventSchema = new Schema({
  subjectUserId: { type: Schema.Types.ObjectId, ref: "Users", required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: "Users" },
  type: { type: String, enum: Object.values(ReportEventType), required: true, index: true },
  resourceType: { type: String, enum: ["job", "material", "business", "profile"] },
  resourceId: { type: Schema.Types.ObjectId },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

reportEventSchema.index({ subjectUserId: 1, type: 1, createdAt: -1 });

export default mongoose.model("ReportEvent", reportEventSchema);
