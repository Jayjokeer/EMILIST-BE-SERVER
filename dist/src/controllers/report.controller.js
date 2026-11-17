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
exports.recordReportEventController = exports.exportReportCsvController = exports.upsertReportTargetController = exports.fetchReportTargetsController = exports.fetchReportController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const reportService = __importStar(require("../services/user-report.service"));
const reportEventService = __importStar(require("../services/report-event.service"));
exports.fetchReportController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await reportService.fetchUserReport(String(req.user._id), req.query);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchReportTargetsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const report = await reportService.fetchUserReport(String(req.user._id), req.query);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { filters: report.filters, target: report.insights.targets });
});
exports.upsertReportTargetController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const target = await reportService.upsertUserTarget(String(req.user._id), req.body);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, target);
});
exports.exportReportCsvController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const report = await reportService.fetchUserReport(String(req.user._id), req.query);
    const csv = reportService.buildUserReportCsv(report);
    const filename = `emilist-report-${report.filters.startDate.toISOString().slice(0, 10)}-${report.filters.endDate.toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(http_status_codes_1.StatusCodes.OK).send(csv);
});
exports.recordReportEventController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const event = await reportEventService.recordResourceReportEvent({
        actorUserId: req.user?._id ? String(req.user._id) : null,
        type: req.body.type,
        resourceType: req.body.resourceType,
        resourceId: req.body.resourceId,
        subjectUserId: req.body.subjectUserId,
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, { id: event._id, recordedAt: event.createdAt });
});
