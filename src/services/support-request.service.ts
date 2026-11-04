import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/error";
import { SupportRequestStatus } from "../enums/support.enum";
import SupportRequest from "../models/support-request.model";

export const supportPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(1, Number(pageValue) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const assertId = (value: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestError(`Invalid ${label}`);
};

export const createSupportRequest = async (requesterId: string, body: any) => {
  assertId(requesterId, "requester id");
  return SupportRequest.create({ ...body, requesterId });
};

export const fetchSupportRequests = async (query: any) => {
  const { page, limit, skip } = supportPagination(query.page, query.limit);
  const filter: any = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.search) filter.$text = { $search: String(query.search).trim() };

  const [requests, total, statusRows] = await Promise.all([
    SupportRequest.find(filter)
      .populate("requesterId", "firstName lastName userName email uniqueId displayImage")
      .populate("assignedAdminId", "fullName email department")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SupportRequest.countDocuments(filter),
    SupportRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(statusRows.map((row: any) => [row._id, row.count]));
  return {
    requests,
    counts: {
      open: counts[SupportRequestStatus.open] || 0,
      inProgress: counts[SupportRequestStatus.inProgress] || 0,
      resolved: counts[SupportRequestStatus.resolved] || 0,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const fetchSupportRequest = async (requestId: string) => {
  assertId(requestId, "support request id");
  const request = await SupportRequest.findById(requestId)
    .populate("requesterId", "firstName lastName userName email uniqueId displayImage status")
    .populate("assignedAdminId", "fullName email department")
    .populate("history.adminId", "fullName email department")
    .lean();
  if (!request) throw new NotFoundError("Support request not found");
  return request;
};

export const updateSupportRequest = async (requestId: string, adminId: string, body: any) => {
  assertId(requestId, "support request id");
  const request: any = await SupportRequest.findById(requestId);
  if (!request) throw new NotFoundError("Support request not found");
  const previousStatus = request.status;
  if (body.status) request.status = body.status;
  if (body.priority) request.priority = body.priority;
  if (body.assignedAdminId !== undefined) request.assignedAdminId = body.assignedAdminId || undefined;
  if (body.resolution !== undefined) request.resolution = body.resolution;
  if (request.status === SupportRequestStatus.resolved) {
    if (!body.resolution && !request.resolution) throw new BadRequestError("A resolution is required to resolve a request");
    request.resolvedAt = new Date();
  } else if (previousStatus === SupportRequestStatus.resolved) {
    request.resolvedAt = undefined;
  }
  request.history.push({
    adminId,
    action: body.status === SupportRequestStatus.resolved ? "resolved" : "updated",
    note: body.note || body.resolution,
    fromStatus: previousStatus,
    toStatus: request.status,
  });
  await request.save();
  return fetchSupportRequest(requestId);
};

export const countUnresolvedSupportRequests = () =>
  SupportRequest.countDocuments({ status: { $in: [SupportRequestStatus.open, SupportRequestStatus.inProgress] } });
