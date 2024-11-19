"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteStatusEnum = exports.ProjectStatusEnum = void 0;
var ProjectStatusEnum;
(function (ProjectStatusEnum) {
    ProjectStatusEnum["pending"] = "pending";
    ProjectStatusEnum["accepted"] = "accepted";
    ProjectStatusEnum["rejected"] = "rejected";
    ProjectStatusEnum["completed"] = "completed";
    ProjectStatusEnum["unpause"] = "unpause";
    ProjectStatusEnum["pause"] = "pause";
})(ProjectStatusEnum || (exports.ProjectStatusEnum = ProjectStatusEnum = {}));
var QuoteStatusEnum;
(function (QuoteStatusEnum) {
    QuoteStatusEnum["pending"] = "pending";
    QuoteStatusEnum["accepted"] = "accepted";
    QuoteStatusEnum["rejected"] = "rejected";
})(QuoteStatusEnum || (exports.QuoteStatusEnum = QuoteStatusEnum = {}));
