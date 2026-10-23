"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = require("mongoose");
const job_attention_enum_1 = require("../src/enums/job-attention.enum");
const job_attention_model_1 = __importDefault(require("../src/models/job-attention.model"));
const job_attention_service_1 = require("../src/services/job-attention.service");
const recipientId = new mongoose_1.Types.ObjectId().toString();
const jobId = new mongoose_1.Types.ObjectId().toString();
const eventId = new mongoose_1.Types.ObjectId().toString();
(0, node_test_1.default)('empty attention does not require frontend animation', () => {
    strict_1.default.deepEqual((0, job_attention_service_1.emptyAttentionSummary)(), {
        requiresAttention: false,
        unviewedCount: 0,
        types: [],
        latestEventAt: null,
        eventIds: [],
    });
});
(0, node_test_1.default)('batched summaries return count, distinct types, latest time, and event IDs', async () => {
    const originalAggregate = job_attention_model_1.default.aggregate;
    const latestEventAt = new Date('2026-10-23T08:30:00.000Z');
    job_attention_model_1.default.aggregate = async () => [{
            _id: new mongoose_1.Types.ObjectId(jobId),
            unviewedCount: 2,
            types: [job_attention_enum_1.JobAttentionType.NEW_APPLICATION],
            latestEventAt,
            eventIds: [new mongoose_1.Types.ObjectId(eventId)],
        }];
    try {
        const summaries = await (0, job_attention_service_1.getJobAttentionSummaries)(recipientId, [jobId]);
        strict_1.default.deepEqual(summaries.get(jobId), {
            requiresAttention: true,
            unviewedCount: 2,
            types: [job_attention_enum_1.JobAttentionType.NEW_APPLICATION],
            latestEventAt,
            eventIds: [eventId],
        });
    }
    finally {
        job_attention_model_1.default.aggregate = originalAggregate;
    }
});
(0, node_test_1.default)('event creation is an idempotent upsert keyed by source and recipient', async () => {
    const originalFindOneAndUpdate = job_attention_model_1.default.findOneAndUpdate;
    let captured = [];
    job_attention_model_1.default.findOneAndUpdate = async (...args) => {
        captured = args;
        return { _id: eventId };
    };
    try {
        await (0, job_attention_service_1.createAttentionEvent)({
            jobId,
            applicationId: new mongoose_1.Types.ObjectId().toString(),
            recipientId,
            actorId: new mongoose_1.Types.ObjectId().toString(),
            type: job_attention_enum_1.JobAttentionType.NEW_APPLICATION,
            sourceId: new mongoose_1.Types.ObjectId().toString(),
        });
        strict_1.default.equal(captured[2].upsert, true);
        strict_1.default.equal(captured[2].new, true);
        strict_1.default.equal(captured[0].recipientId, recipientId);
    }
    finally {
        job_attention_model_1.default.findOneAndUpdate = originalFindOneAndUpdate;
    }
});
(0, node_test_1.default)('snapshot acknowledgement only updates events at or before the loaded timestamp', async () => {
    const originalUpdateMany = job_attention_model_1.default.updateMany;
    const originalAggregate = job_attention_model_1.default.aggregate;
    const viewedThrough = new Date('2026-10-23T08:30:00.000Z');
    let updateFilter;
    job_attention_model_1.default.updateMany = async (filter) => {
        updateFilter = filter;
        return { modifiedCount: 1 };
    };
    job_attention_model_1.default.aggregate = async () => [];
    try {
        const summary = await (0, job_attention_service_1.markAttentionViewed)({
            recipientId,
            jobId,
            type: job_attention_enum_1.JobAttentionType.NEW_APPLICATION,
            viewedThrough,
        });
        strict_1.default.deepEqual(updateFilter.createdAt, { $lte: viewedThrough });
        strict_1.default.equal(updateFilter.recipientId, recipientId);
        strict_1.default.equal(summary.requiresAttention, false);
    }
    finally {
        job_attention_model_1.default.updateMany = originalUpdateMany;
        job_attention_model_1.default.aggregate = originalAggregate;
    }
});
(0, node_test_1.default)('a user cannot acknowledge event IDs outside their recipient/context scope', async () => {
    const originalCountDocuments = job_attention_model_1.default.countDocuments;
    job_attention_model_1.default.countDocuments = async () => 0;
    try {
        await strict_1.default.rejects((0, job_attention_service_1.markAttentionViewed)({
            recipientId,
            jobId,
            type: job_attention_enum_1.JobAttentionType.NEW_APPLICATION,
            eventIds: [eventId],
        }), /do not belong to this user or context/);
    }
    finally {
        job_attention_model_1.default.countDocuments = originalCountDocuments;
    }
});
