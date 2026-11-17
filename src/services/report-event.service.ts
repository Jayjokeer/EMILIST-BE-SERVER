import { Types } from "mongoose";
import ReportEvent, { ReportEventType } from "../models/report-event.model";
import { BadRequestError, NotFoundError } from "../errors/error";
import Jobs from "../models/jobs.model";
import Product from "../models/product.model";
import Business from "../models/business.model";

const validId = (value?: string | null) => value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;

export const recordReportEvent = async (payload: {
  subjectUserId: string;
  actorUserId?: string | null;
  type: ReportEventType;
  resourceType?: "job" | "material" | "business" | "profile";
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}) => ReportEvent.create({
  subjectUserId: validId(payload.subjectUserId),
  actorUserId: validId(payload.actorUserId),
  type: payload.type,
  resourceType: payload.resourceType,
  resourceId: validId(payload.resourceId),
  metadata: payload.metadata || {},
});

export const recordResourceReportEvent = async (payload: {
  actorUserId?: string | null;
  type: string;
  resourceType: string;
  resourceId?: string;
  subjectUserId?: string;
}) => {
  const allowedTypes = [ReportEventType.impression, ReportEventType.click, ReportEventType.share, ReportEventType.contact];
  if (!allowedTypes.includes(payload.type as ReportEventType)) throw new BadRequestError("Unsupported report event type");
  if (!["job", "material", "business", "profile"].includes(payload.resourceType)) throw new BadRequestError("Unsupported report resource type");

  let subjectUserId = payload.subjectUserId;
  let resourceId = payload.resourceId;
  if (payload.resourceType !== "profile") {
    if (!resourceId || !Types.ObjectId.isValid(resourceId)) throw new BadRequestError("A valid resourceId is required");
    const model: any = payload.resourceType === "job" ? Jobs : payload.resourceType === "material" ? Product : Business;
    const resource = await model.findById(resourceId).select("userId").lean() as any;
    if (!resource) throw new NotFoundError("Report resource not found");
    subjectUserId = String(resource.userId);
  }
  if (!subjectUserId || !Types.ObjectId.isValid(subjectUserId)) throw new BadRequestError("A valid subjectUserId is required");

  return recordReportEvent({
    subjectUserId,
    actorUserId: payload.actorUserId,
    type: payload.type as ReportEventType,
    resourceType: payload.resourceType as "job" | "material" | "business" | "profile",
    resourceId,
  });
};
