"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingEnum = exports.QuoteStatusEnum = exports.JobStatusEnum = exports.MilestonePaymentStatus = exports.MilestoneEnum = exports.JobPeriod = exports.JobExpertLevel = exports.JobType = void 0;
var JobType;
(function (JobType) {
    JobType["biddable"] = "biddable";
    JobType["regular"] = "regular";
    JobType["direct"] = "direct";
})(JobType || (exports.JobType = JobType = {}));
var JobExpertLevel;
(function (JobExpertLevel) {
    JobExpertLevel["one"] = "one";
    JobExpertLevel["two"] = "two";
    JobExpertLevel["three"] = "three";
    JobExpertLevel["four"] = "four";
})(JobExpertLevel || (exports.JobExpertLevel = JobExpertLevel = {}));
;
var JobPeriod;
(function (JobPeriod) {
    JobPeriod["days"] = "days";
    JobPeriod["weeks"] = "weeks";
    JobPeriod["months"] = "months";
    JobPeriod["years"] = "years";
})(JobPeriod || (exports.JobPeriod = JobPeriod = {}));
var MilestoneEnum;
(function (MilestoneEnum) {
    MilestoneEnum["pending"] = "pending";
    MilestoneEnum["overdue"] = "overdue";
    MilestoneEnum["completed"] = "completed";
    MilestoneEnum["active"] = "active";
    MilestoneEnum["paused"] = "paused";
})(MilestoneEnum || (exports.MilestoneEnum = MilestoneEnum = {}));
var MilestonePaymentStatus;
(function (MilestonePaymentStatus) {
    MilestonePaymentStatus["paid"] = "paid";
    MilestonePaymentStatus["processing"] = "processing";
    MilestonePaymentStatus["unpaid"] = "unpaid";
    MilestonePaymentStatus["canceled"] = "canceled";
})(MilestonePaymentStatus || (exports.MilestonePaymentStatus = MilestonePaymentStatus = {}));
var JobStatusEnum;
(function (JobStatusEnum) {
    JobStatusEnum["pending"] = "pending";
    JobStatusEnum["complete"] = "completed";
    JobStatusEnum["active"] = "active";
    JobStatusEnum["paused"] = "paused";
})(JobStatusEnum || (exports.JobStatusEnum = JobStatusEnum = {}));
var QuoteStatusEnum;
(function (QuoteStatusEnum) {
    QuoteStatusEnum["pending"] = "pending";
    QuoteStatusEnum["accepted"] = "accepted";
    QuoteStatusEnum["rejected"] = "rejected";
})(QuoteStatusEnum || (exports.QuoteStatusEnum = QuoteStatusEnum = {}));
var RatingEnum;
(function (RatingEnum) {
    RatingEnum["one"] = "1";
    RatingEnum["two"] = "2";
    RatingEnum["three"] = "3";
    RatingEnum["four"] = "4";
    RatingEnum["five"] = "5";
})(RatingEnum || (exports.RatingEnum = RatingEnum = {}));
