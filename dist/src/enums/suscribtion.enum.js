"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionPaymentStatus = exports.PromotionTargetEnum = exports.SubscriptionPeriodEnum = exports.SubscriptionPerksEnum = exports.SubscriptionStatusEnum = void 0;
var SubscriptionStatusEnum;
(function (SubscriptionStatusEnum) {
    SubscriptionStatusEnum["active"] = "active";
    SubscriptionStatusEnum["expired"] = "expired";
    SubscriptionStatusEnum["canceled"] = "canceled";
})(SubscriptionStatusEnum || (exports.SubscriptionStatusEnum = SubscriptionStatusEnum = {}));
;
var SubscriptionPerksEnum;
(function (SubscriptionPerksEnum) {
    SubscriptionPerksEnum["jobPost"] = "jobPost";
    SubscriptionPerksEnum["invites"] = "invites";
    SubscriptionPerksEnum["referrals"] = "referrals";
    SubscriptionPerksEnum["product"] = "product";
    SubscriptionPerksEnum["business"] = "business";
    SubscriptionPerksEnum["expert"] = "expert";
    SubscriptionPerksEnum["analytics"] = "analytics";
    SubscriptionPerksEnum["support"] = "support";
    SubscriptionPerksEnum["jobApplication"] = "jobApplication";
})(SubscriptionPerksEnum || (exports.SubscriptionPerksEnum = SubscriptionPerksEnum = {}));
;
var SubscriptionPeriodEnum;
(function (SubscriptionPeriodEnum) {
    SubscriptionPeriodEnum["monthly"] = "monthly";
    SubscriptionPeriodEnum["yearly"] = "yearly";
})(SubscriptionPeriodEnum || (exports.SubscriptionPeriodEnum = SubscriptionPeriodEnum = {}));
;
var PromotionTargetEnum;
(function (PromotionTargetEnum) {
    PromotionTargetEnum["anybody"] = "anybody";
    PromotionTargetEnum["selected"] = "selected";
})(PromotionTargetEnum || (exports.PromotionTargetEnum = PromotionTargetEnum = {}));
;
var PromotionPaymentStatus;
(function (PromotionPaymentStatus) {
    PromotionPaymentStatus["pending"] = "pending";
    PromotionPaymentStatus["paid"] = "paid";
})(PromotionPaymentStatus || (exports.PromotionPaymentStatus = PromotionPaymentStatus = {}));
;
