"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageAttachmentType = exports.createMessage = void 0;
const message_model_1 = __importDefault(require("../models/message.model"));
const createMessage = async (data) => {
    return message_model_1.default.create(data);
};
exports.createMessage = createMessage;
const getMessageAttachmentType = (mimeType) => {
    if (mimeType.startsWith("image/"))
        return "image";
    if (mimeType.startsWith("audio/") || mimeType === "video/webm")
        return "audio";
    return "file";
};
exports.getMessageAttachmentType = getMessageAttachmentType;
