import { Router, Request, Response } from "express";
import * as chatController from "../controllers/chat.controller";
import { userAuth } from "../middlewares/current-user";
import { chatAttachmentUpload, rejectChatAttachmentLinks } from "../utils/image-upload";

const router = Router();

router.route("/send-message/:receiverId").post(userAuth, chatAttachmentUpload, rejectChatAttachmentLinks, chatController.sendMessageController);
router.route("/fetch-message/:userId").get(userAuth, chatController.getMessagesController);
router.route("/fetch-all-chat").get(userAuth, chatController.getChatsController);
router.route("/chats/:chatId/read").patch(userAuth, chatController.markChatAsReadController);

export { router as ChatRoute };
