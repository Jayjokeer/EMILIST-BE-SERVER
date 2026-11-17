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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordResourceReportEvent = exports.recordReportEvent = void 0;
const mongoose_1 = require("mongoose");
const report_event_model_1 = __importStar(require("../models/report-event.model"));
const error_1 = require("../errors/error");
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const business_model_1 = __importDefault(require("../models/business.model"));
const validId = (value) => value && mongoose_1.Types.ObjectId.isValid(value) ? new mongoose_1.Types.ObjectId(value) : undefined;
const recordReportEvent = async (payload) => report_event_model_1.default.create({
    subjectUserId: validId(payload.subjectUserId),
    actorUserId: validId(payload.actorUserId),
    type: payload.type,
    resourceType: payload.resourceType,
    resourceId: validId(payload.resourceId),
    metadata: payload.metadata || {},
});
exports.recordReportEvent = recordReportEvent;
const recordResourceReportEvent = async (payload) => {
    const allowedTypes = [report_event_model_1.ReportEventType.impression, report_event_model_1.ReportEventType.click, report_event_model_1.ReportEventType.share, report_event_model_1.ReportEventType.contact];
    if (!allowedTypes.includes(payload.type))
        throw new error_1.BadRequestError("Unsupported report event type");
    if (!["job", "material", "business", "profile"].includes(payload.resourceType))
        throw new error_1.BadRequestError("Unsupported report resource type");
    let subjectUserId = payload.subjectUserId;
    let resourceId = payload.resourceId;
    if (payload.resourceType !== "profile") {
        if (!resourceId || !mongoose_1.Types.ObjectId.isValid(resourceId))
            throw new error_1.BadRequestError("A valid resourceId is required");
        const model = payload.resourceType === "job" ? jobs_model_1.default : payload.resourceType === "material" ? product_model_1.default : business_model_1.default;
        const resource = await model.findById(resourceId).select("userId").lean();
        if (!resource)
            throw new error_1.NotFoundError("Report resource not found");
        subjectUserId = String(resource.userId);
    }
    if (!subjectUserId || !mongoose_1.Types.ObjectId.isValid(subjectUserId))
        throw new error_1.BadRequestError("A valid subjectUserId is required");
    return (0, exports.recordReportEvent)({
        subjectUserId,
        actorUserId: payload.actorUserId,
        type: payload.type,
        resourceType: payload.resourceType,
        resourceId,
    });
};
exports.recordResourceReportEvent = recordResourceReportEvent;
