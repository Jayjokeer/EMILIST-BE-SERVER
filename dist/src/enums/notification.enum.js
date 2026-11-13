"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationLevelEnum = exports.NotificationTypeEnum = void 0;
var NotificationTypeEnum;
(function (NotificationTypeEnum) {
    NotificationTypeEnum["message"] = "message";
    NotificationTypeEnum["job"] = "job";
    NotificationTypeEnum["material"] = "material";
    NotificationTypeEnum["expert"] = "expert";
    NotificationTypeEnum["support"] = "support";
    NotificationTypeEnum["account"] = "account";
    NotificationTypeEnum["wallet"] = "wallet";
    NotificationTypeEnum["payment"] = "payment";
    NotificationTypeEnum["order"] = "order";
    NotificationTypeEnum["subscription"] = "subscription";
    NotificationTypeEnum["system"] = "system";
})(NotificationTypeEnum || (exports.NotificationTypeEnum = NotificationTypeEnum = {}));
var NotificationLevelEnum;
(function (NotificationLevelEnum) {
    NotificationLevelEnum["info"] = "info";
    NotificationLevelEnum["alert"] = "alert";
    NotificationLevelEnum["success"] = "success";
    NotificationLevelEnum["error"] = "error";
})(NotificationLevelEnum || (exports.NotificationLevelEnum = NotificationLevelEnum = {}));
