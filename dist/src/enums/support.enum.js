"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequestCategory = exports.SupportRequestPriority = exports.SupportRequestStatus = void 0;
var SupportRequestStatus;
(function (SupportRequestStatus) {
    SupportRequestStatus["open"] = "open";
    SupportRequestStatus["inProgress"] = "in_progress";
    SupportRequestStatus["resolved"] = "resolved";
})(SupportRequestStatus || (exports.SupportRequestStatus = SupportRequestStatus = {}));
var SupportRequestPriority;
(function (SupportRequestPriority) {
    SupportRequestPriority["low"] = "low";
    SupportRequestPriority["normal"] = "normal";
    SupportRequestPriority["high"] = "high";
    SupportRequestPriority["urgent"] = "urgent";
})(SupportRequestPriority || (exports.SupportRequestPriority = SupportRequestPriority = {}));
var SupportRequestCategory;
(function (SupportRequestCategory) {
    SupportRequestCategory["account"] = "account";
    SupportRequestCategory["job"] = "job";
    SupportRequestCategory["payment"] = "payment";
    SupportRequestCategory["marketplace"] = "marketplace";
    SupportRequestCategory["report"] = "report";
    SupportRequestCategory["other"] = "other";
})(SupportRequestCategory || (exports.SupportRequestCategory = SupportRequestCategory = {}));
