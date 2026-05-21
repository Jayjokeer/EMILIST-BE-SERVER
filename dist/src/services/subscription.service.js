"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersSubscription = exports.fetchAllUserSubscriptionsAdmin = exports.createPromotion = exports.fetchCostPerClick = exports.fetchAllSubscriptionsAdmin = exports.findExpiredSubscriptions = exports.getSubscriptionById = exports.getActiveSubscriptionWithoutDetails = exports.getActiveSubscription = exports.createSubscription = void 0;
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const app_config_model_1 = __importDefault(require("../models/app-config.model"));
const promotion_model_1 = __importDefault(require("../models/promotion.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const plan_model_1 = __importDefault(require("../models/plan.model"));
const createSubscription = async (data) => {
    return await subscription_model_1.default.create(data);
};
exports.createSubscription = createSubscription;
const getActiveSubscription = async (userId) => {
    return await subscription_model_1.default.findOne({ userId, status: suscribtion_enum_1.SubscriptionStatusEnum.active }).populate('planId');
};
exports.getActiveSubscription = getActiveSubscription;
const getActiveSubscriptionWithoutDetails = async (userId) => {
    return await subscription_model_1.default.findOne({ userId, status: suscribtion_enum_1.SubscriptionStatusEnum.active });
};
exports.getActiveSubscriptionWithoutDetails = getActiveSubscriptionWithoutDetails;
const getSubscriptionById = async (subscriptionId) => {
    return await subscription_model_1.default.findById(subscriptionId);
};
exports.getSubscriptionById = getSubscriptionById;
const findExpiredSubscriptions = async () => {
    const currentDate = new Date();
    return await subscription_model_1.default.find({
        endDate: { $lte: currentDate },
        status: suscribtion_enum_1.SubscriptionStatusEnum.active,
    });
};
exports.findExpiredSubscriptions = findExpiredSubscriptions;
const fetchAllSubscriptionsAdmin = async (limit, page, search, status) => {
    const skip = (page - 1) * limit;
    const filters = {};
    if (status)
        filters.status = status;
    if (search) {
        const users = await users_model_1.default.find({
            $or: [
                { fullName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        }).select("_id");
        const plans = await plan_model_1.default.find({
            name: { $regex: search, $options: "i" },
        }).select("_id");
        filters.$or = [
            { userId: { $in: users.map(u => u._id) } },
            { planId: { $in: plans.map(p => p._id) } },
        ];
    }
    const subscriptions = await subscription_model_1.default.find(filters)
        .populate("userId", "fullName userName email")
        .populate("planId", "name price")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    const totalSubscriptions = await subscription_model_1.default.countDocuments(filters);
    const planCounts = await subscription_model_1.default.aggregate([
        { $lookup: { from: "plans", localField: "planId", foreignField: "_id", as: "plan" } },
        { $unwind: "$plan" },
        {
            $group: {
                _id: "$plan.name",
                count: { $sum: 1 },
            },
        },
    ]);
    const totalBasic = planCounts.find(p => p._id?.toLowerCase() === "basic")?.count || 0;
    const totalSilver = planCounts.find(p => p._id?.toLowerCase() === "silver")?.count || 0;
    const totalGold = planCounts.find(p => p._id?.toLowerCase() === "gold")?.count || 0;
    const totalPlatinum = planCounts.find(p => p._id?.toLowerCase() === "platinum")?.count || 0;
    return {
        subscriptions,
        totalSubscriptions,
        totalBasic,
        totalSilver,
        totalGold,
        totalPlatinum,
    };
};
exports.fetchAllSubscriptionsAdmin = fetchAllSubscriptionsAdmin;
const fetchCostPerClick = async () => {
    const config = await app_config_model_1.default.findOne();
    return config.costPerClick;
};
exports.fetchCostPerClick = fetchCostPerClick;
const createPromotion = async (data) => {
    return await promotion_model_1.default.create(data);
};
exports.createPromotion = createPromotion;
const fetchAllUserSubscriptionsAdmin = async (limit, page, userId) => {
    const skip = (page - 1) * limit;
    const subscriptions = await subscription_model_1.default.find({ userId: userId }).skip(skip).limit(limit).populate('planId', 'name price');
    const totalSubscriptions = await subscription_model_1.default.countDocuments({ userId: userId });
    return { subscriptions, totalSubscriptions };
};
exports.fetchAllUserSubscriptionsAdmin = fetchAllUserSubscriptionsAdmin;
const getAllUsersSubscription = async (userId) => {
    return await subscription_model_1.default.findOne({ userId }).populate('planId');
};
exports.getAllUsersSubscription = getAllUsersSubscription;
