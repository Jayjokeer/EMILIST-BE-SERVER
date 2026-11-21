import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { userAuth } from "../middlewares/current-user";
import { validateDashboardOverview } from "../validations/dashboard.validation";

const router = Router();

router.route("/overview").get(userAuth, validateDashboardOverview, dashboardController.dashboardOverviewController);

export { router as DashboardRoute };
