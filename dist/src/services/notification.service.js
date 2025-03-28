"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.fetchUserNotifications = exports.findNotificationById = exports.createNotification = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const createNotification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.default.create(data);
});
exports.createNotification = createNotification;
const findNotificationById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.default.findById(id);
});
exports.findNotificationById = findNotificationById;
const fetchUserNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.default.find({ userId: userId });
});
exports.fetchUserNotifications = fetchUserNotifications;
const deleteNotification = (notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.default.findByIdAndDelete(notificationId);
});
exports.deleteNotification = deleteNotification;
