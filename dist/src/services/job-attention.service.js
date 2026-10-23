"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAttentionViewed = exports.getApplicationAttentionSummaries = exports.getJobAttentionSummaries = exports.createAttentionEvent = exports.emptyAttentionSummary = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const job_attention_model_1 = __importDefault(require("../models/job-attention.model"));
const emptyAttentionSummary = () => ({
    requiresAttention: false,
    unviewedCount: 0,
    types: [],
    latestEventAt: null,
    eventIds: [],
});
exports.emptyAttentionSummary = emptyAttentionSummary;
const createAttentionEvent = async (data) => job_attention_model_1.default.findOneAndUpdate({ type: data.type, sourceId: data.sourceId, recipientId: data.recipientId }, { $setOnInsert: data }, { upsert: true, new: true, setDefaultsOnInsert: true });
exports.createAttentionEvent = createAttentionEvent;
const buildSummaryMap = async (recipientId, field, ids) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length)
        return new Map();
    const summaries = await job_attention_model_1.default.aggregate([
        {
            $match: {
                recipientId: new mongoose_1.Types.ObjectId(recipientId),
                viewedAt: null,
                [field]: { $in: uniqueIds.map(id => new mongoose_1.Types.ObjectId(id)) },
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: `$${field}`,
                unviewedCount: { $sum: 1 },
                types: { $addToSet: '$type' },
                latestEventAt: { $max: '$createdAt' },
                eventIds: { $push: '$_id' },
            },
        },
    ]);
    return new Map(summaries.map((summary) => [
        String(summary._id),
        {
            requiresAttention: summary.unviewedCount > 0,
            unviewedCount: summary.unviewedCount,
            types: summary.types,
            latestEventAt: summary.latestEventAt,
            eventIds: summary.eventIds.map(String),
        },
    ]));
};
const getJobAttentionSummaries = (recipientId, jobIds) => buildSummaryMap(recipientId, 'jobId', jobIds);
exports.getJobAttentionSummaries = getJobAttentionSummaries;
const getApplicationAttentionSummaries = (recipientId, applicationIds) => buildSummaryMap(recipientId, 'applicationId', applicationIds);
exports.getApplicationAttentionSummaries = getApplicationAttentionSummaries;
const validateViewSelection = async (recipientId, context, eventIds) => {
    if (!eventIds?.length)
        return;
    const uniqueEventIds = [...new Set(eventIds)];
    if (uniqueEventIds.some(id => !mongoose_1.Types.ObjectId.isValid(id))) {
        throw new error_1.BadRequestError('One or more attention event IDs are invalid.');
    }
    const count = await job_attention_model_1.default.countDocuments({
        _id: { $in: uniqueEventIds },
        recipientId,
        type: context.type,
        ...(context.jobId ? { jobId: context.jobId } : {}),
        ...(context.applicationId ? { applicationId: context.applicationId } : {}),
    });
    if (count !== uniqueEventIds.length) {
        throw new error_1.BadRequestError('One or more attention events do not belong to this user or context.');
    }
};
const markAttentionViewed = async (data) => {
    if (!data.eventIds?.length && !data.viewedThrough) {
        throw new error_1.BadRequestError('Provide eventIds or viewedThrough from the attention response.');
    }
    await validateViewSelection(data.recipientId, data, data.eventIds);
    const selection = data.eventIds?.length
        ? { _id: { $in: [...new Set(data.eventIds)] } }
        : { createdAt: { $lte: data.viewedThrough } };
    await job_attention_model_1.default.updateMany({
        recipientId: data.recipientId,
        viewedAt: null,
        type: data.type,
        ...(data.jobId ? { jobId: data.jobId } : {}),
        ...(data.applicationId ? { applicationId: data.applicationId } : {}),
        ...selection,
    }, { $set: { viewedAt: new Date() } });
    const map = data.applicationId
        ? await (0, exports.getApplicationAttentionSummaries)(data.recipientId, [data.applicationId])
        : await (0, exports.getJobAttentionSummaries)(data.recipientId, [data.jobId]);
    return map.get(String(data.applicationId || data.jobId)) || (0, exports.emptyAttentionSummary)();
};
exports.markAttentionViewed = markAttentionViewed;
