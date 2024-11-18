import { Router, Request, Response } from "express";
import * as chatController from "../controllers/chat.controller";
import { userAuth } from "../middlewares/current-user";

const router = Router();

router.route("/send-message/:receiverId").post(userAuth, chatController.sendMessageController);
router.route("/fetch-message/:userId").get(userAuth, chatController.getMessagesController);
router.route("/fetch-all-chat").get(userAuth, chatController.getChatsController);

export { router as ChatRoute };