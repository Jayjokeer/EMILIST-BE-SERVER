import { Router, Request, Response } from "express";
import * as notificationController from "../controllers/notification.controller";
import { userAuth } from "../middlewares/current-user";

const router = Router();

router.route("/fetch-user-notification").get(userAuth, notificationController.getAllUserNotificationsController);

export { router as NotificationRoute };