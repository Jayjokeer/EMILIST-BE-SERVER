"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUnresolvedSupportRequests = exports.updateSupportRequest = exports.fetchSupportRequest = exports.fetchSupportRequests = exports.createSupportRequest = exports.supportPagination = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const support_enum_1 = require("../enums/support.enum");
const support_request_model_1 = __importDefault(require("../models/support-request.model"));
const supportPagination = (pageValue, limitValue) => {
    const page = Math.max(1, Number(pageValue) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
exports.supportPagination = supportPagination;
const assertId = (value, label) => {
    if (!mongoose_1.Types.ObjectId.isValid(value))
        throw new error_1.BadRequestError(`Invalid ${label}`);
};
const createSupportRequest = async (requesterId, body) => {
    assertId(requesterId, "requester id");
    return support_request_model_1.default.create({ ...body, requesterId });
};
exports.createSupportRequest = createSupportRequest;
const fetchSupportRequests = async (query) => {
    const { page, limit, skip } = (0, exports.supportPagination)(query.page, query.limit);
    const filter = {};
    if (query.status)
        filter.status = query.status;
    if (query.priority)
        filter.priority = query.priority;
    if (query.category)
        filter.category = query.category;
    if (query.search)
        filter.$text = { $search: String(query.search).trim() };
    const [requests, total, statusRows] = await Promise.all([
        support_request_model_1.default.find(filter)
            .populate("requesterId", "firstName lastName userName email uniqueId displayImage")
            .populate("assignedAdminId", "fullName email department")
            .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        support_request_model_1.default.countDocuments(filter),
        support_request_model_1.default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    const counts = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));
    return {
        requests,
        counts: {
            open: counts[support_enum_1.SupportRequestStatus.open] || 0,
            inProgress: counts[support_enum_1.SupportRequestStatus.inProgress] || 0,
            resolved: counts[support_enum_1.SupportRequestStatus.resolved] || 0,
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
exports.fetchSupportRequests = fetchSupportRequests;
const fetchSupportRequest = async (requestId) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findById(requestId)
        .populate("requesterId", "firstName lastName userName email uniqueId displayImage status")
        .populate("assignedAdminId", "fullName email department")
        .populate("history.adminId", "fullName email department")
        .lean();
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    return request;
};
exports.fetchSupportRequest = fetchSupportRequest;
const updateSupportRequest = async (requestId, adminId, body) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findById(requestId);
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    const previousStatus = request.status;
    if (body.status)
        request.status = body.status;
    if (body.priority)
        request.priority = body.priority;
    if (body.assignedAdminId !== undefined)
        request.assignedAdminId = body.assignedAdminId || undefined;
    if (body.resolution !== undefined)
        request.resolution = body.resolution;
    if (request.status === support_enum_1.SupportRequestStatus.resolved) {
        if (!body.resolution && !request.resolution)
            throw new error_1.BadRequestError("A resolution is required to resolve a request");
        request.resolvedAt = new Date();
    }
    else if (previousStatus === support_enum_1.SupportRequestStatus.resolved) {
        request.resolvedAt = undefined;
    }
    request.history.push({
        adminId,
        action: body.status === support_enum_1.SupportRequestStatus.resolved ? "resolved" : "updated",
        note: body.note || body.resolution,
        fromStatus: previousStatus,
        toStatus: request.status,
    });
    await request.save();
    return (0, exports.fetchSupportRequest)(requestId);
};
exports.updateSupportRequest = updateSupportRequest;
const countUnresolvedSupportRequests = () => support_request_model_1.default.countDocuments({ status: { $in: [support_enum_1.SupportRequestStatus.open, support_enum_1.SupportRequestStatus.inProgress] } });
exports.countUnresolvedSupportRequests = countUnresolvedSupportRequests;
