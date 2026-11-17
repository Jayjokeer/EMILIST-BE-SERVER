import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { optionalUserAuth, userAuth } from "../middlewares/current-user";

const router = Router();

router.route("/").get(userAuth, reportController.fetchReportController);
router.route("/export").get(userAuth, reportController.exportReportCsvController);
router.route("/targets").get(userAuth, reportController.fetchReportTargetsController);
router.route("/targets").put(userAuth, reportController.upsertReportTargetController);
router.route("/events").post(optionalUserAuth, reportController.recordReportEventController);

export { router as ReportRoute };
