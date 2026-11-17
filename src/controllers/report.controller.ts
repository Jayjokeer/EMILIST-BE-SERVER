import { Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as reportService from "../services/user-report.service";
import * as reportEventService from "../services/report-event.service";

export const fetchReportController = catchAsync(async (req: JwtPayload, res: Response) => {
  const data = await reportService.fetchUserReport(String(req.user._id), req.query);
  return successResponse(res, StatusCodes.OK, data);
});

export const fetchReportTargetsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const report = await reportService.fetchUserReport(String(req.user._id), req.query);
  return successResponse(res, StatusCodes.OK, { filters: report.filters, target: report.insights.targets });
});

export const upsertReportTargetController = catchAsync(async (req: JwtPayload, res: Response) => {
  const target = await reportService.upsertUserTarget(String(req.user._id), req.body);
  return successResponse(res, StatusCodes.OK, target);
});

export const exportReportCsvController = catchAsync(async (req: JwtPayload, res: Response) => {
  const report = await reportService.fetchUserReport(String(req.user._id), req.query);
  const csv = reportService.buildUserReportCsv(report);
  const filename = `emilist-report-${report.filters.startDate.toISOString().slice(0, 10)}-${report.filters.endDate.toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(StatusCodes.OK).send(csv);
});

export const recordReportEventController = catchAsync(async (req: JwtPayload, res: Response) => {
  const event = await reportEventService.recordResourceReportEvent({
    actorUserId: req.user?._id ? String(req.user._id) : null,
    type: req.body.type,
    resourceType: req.body.resourceType,
    resourceId: req.body.resourceId,
    subjectUserId: req.body.subjectUserId,
  });
  return successResponse(res, StatusCodes.CREATED, { id: event._id, recordedAt: event.createdAt });
});
