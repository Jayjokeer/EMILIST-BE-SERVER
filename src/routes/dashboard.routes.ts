import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { userAuth } from "../middlewares/current-user";

const router = Router();

router.route("/overview").get(userAuth, dashboardController.dashboardOverviewController);

export { router as DashboardRoute };
