export enum SubscriptionStatusEnum {
    active = "active",
    expired = "expired",
    canceled = "canceled"
};

export enum SubscriptionPerksEnum {
    jobPost = "jobPost",
    invites = "invites",
    referrals = "referrals",
    product = "product",
    business = "business",
    expert = "expert",
    analytics= "analytics",
    support = "support",
    jobApplication= "jobApplication",
};

export enum SubscriptionPeriodEnum {
    monthly = "monthly",
    yearly = "yearly"
};

export enum PromotionTargetEnum {
    anybody = "anybody",
    selected = "selected"
};

export enum PromotionPaymentStatus {
    pending = "pending",
    paid = "paid"
};

export const PROMOTION_PLAN_DURATIONS = [7, 14, 30] as const;

export type PromotionPlanDuration = typeof PROMOTION_PLAN_DURATIONS[number];
