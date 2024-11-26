import { Router, Request, Response } from "express";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

router.route("/fetch-user-notification").get(notificationController.getAllUserNotificationsController);

export { router as NotificationRoute };