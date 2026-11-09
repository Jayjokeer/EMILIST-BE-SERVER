"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishSpotlight = exports.updateSubscriptionPrices = exports.updatePlatformSettings = exports.fetchAdminSettings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const app_config_model_1 = __importDefault(require("../models/app-config.model"));
const plan_model_1 = __importDefault(require("../models/plan.model"));
const admin_model_1 = __importDefault(require("../models/admin.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const business_model_1 = __importDefault(require("../models/business.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const admin_action_model_1 = __importDefault(require("../models/admin-action.model"));
const error_1 = require("../errors/error");
const getConfig = () => app_config_model_1.default.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true, setDefaultsOnInsert: true });
const fetchAdminSettings = async (search = "") => {
    const regex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : undefined;
    const userFilter = regex ? { $or: [{ firstName: regex }, { lastName: regex }, { userName: regex }, { email: regex }] } : {};
    const [config, plans, admins, candidateUsers] = await Promise.all([
        getConfig(),
        plan_model_1.default.find().sort({ price: 1 }).lean(),
        admin_model_1.default.find().select("fullName email profileImage department role jobTitle permissions status createdAt updatedAt").sort({ createdAt: 1 }).lean(),
        users_model_1.default.find(userFilter).select("firstName lastName userName email displayImage uniqueId").limit(40).lean(),
    ]);
    const ids = candidateUsers.map((user) => user._id);
    const [businesses, merchants] = await Promise.all([
        business_model_1.default.find({ userId: { $in: ids } }).select("userId businessName reviews").populate("reviews", "rating").lean(),
        product_model_1.default.aggregate([{ $match: { userId: { $in: ids }, isDeleted: { $ne: true } } }, { $group: { _id: "$userId", listings: { $sum: 1 }, unitsSold: { $sum: "$totalUnitsSold" } } }]),
    ]);
    const businessByUser = new Map(businesses.map((business) => [String(business.userId), business]));
    const merchantByUser = new Map(merchants.map((merchant) => [String(merchant._id), merchant]));
    const candidates = candidateUsers.map((user) => {
        const expert = businessByUser.get(String(user._id));
        const ratings = expert?.reviews?.map((review) => Number(review.rating || 0)).filter((rating) => rating > 0) || [];
        return {
            ...user,
            expert: expert ? { ...expert, averageRating: ratings.length ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)) : 0, reviewCount: ratings.length } : null,
            merchant: merchantByUser.get(String(user._id)) || null,
        };
    }).filter((user) => user.expert || user.merchant);
    return { platform: config, subscriptions: plans, spotlight: { expertUserId: config?.spotlightExpertUserId || null, merchantUserId: config?.spotlightMerchantUserId || null, publishedAt: config?.spotlightPublishedAt || null, candidates }, roles: admins };
};
exports.fetchAdminSettings = fetchAdminSettings;
const updatePlatformSettings = async (payload, adminId) => {
    const previous = await getConfig();
    const minimum = Number(payload.minimumWithdrawalAmount ?? previous?.minimumWithdrawalAmount ?? 0);
    const maximum = Number(payload.maximumWithdrawalAmount ?? previous?.maximumWithdrawalAmount ?? 0);
    if (maximum < minimum)
        throw new error_1.BadRequestError("Maximum withdrawal amount must be greater than or equal to the minimum withdrawal amount");
    const config = await app_config_model_1.default.findOneAndUpdate({}, { $set: payload }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    await admin_action_model_1.default.create({ adminId, targetType: "settings", action: "settings.platform_updated", previousState: previous?.toObject(), newState: config?.toObject() });
    return config;
};
exports.updatePlatformSettings = updatePlatformSettings;
const updateSubscriptionPrices = async (plans, adminId) => {
    const existing = await plan_model_1.default.find({ name: { $in: plans.map((plan) => plan.name) } }).lean();
    const found = new Set(existing.map((plan) => plan.name));
    const missing = plans.map((plan) => plan.name).filter((name) => !found.has(name));
    if (missing.length)
        throw new error_1.NotFoundError(`Subscription plan(s) not found: ${missing.join(", ")}`);
    await plan_model_1.default.bulkWrite(plans.map((plan) => ({ updateOne: { filter: { name: plan.name }, update: { $set: { price: plan.price, ...(plan.isActive === undefined ? {} : { isActive: plan.isActive }) } } } })));
    await admin_action_model_1.default.create({ adminId, targetType: "settings", action: "settings.subscription_prices_updated", previousState: existing, newState: plans });
    return plan_model_1.default.find().sort({ price: 1 }).lean();
};
exports.updateSubscriptionPrices = updateSubscriptionPrices;
const publishSpotlight = async (expertUserId, merchantUserId, adminId) => {
    if (!mongoose_1.default.isValidObjectId(expertUserId) || !mongoose_1.default.isValidObjectId(merchantUserId))
        throw new error_1.BadRequestError("Valid expert and merchant user ids are required");
    const [expert, merchant] = await Promise.all([business_model_1.default.exists({ userId: expertUserId }), product_model_1.default.exists({ userId: merchantUserId, isDeleted: { $ne: true } })]);
    if (!expert)
        throw new error_1.BadRequestError("Selected expert does not have an expert profile");
    if (!merchant)
        throw new error_1.BadRequestError("Selected merchant does not have a material listing");
    const publishedAt = new Date();
    const config = await app_config_model_1.default.findOneAndUpdate({}, { $set: { spotlightExpertUserId: expertUserId, spotlightMerchantUserId: merchantUserId, spotlightPublishedAt: publishedAt, spotlightPublishedBy: adminId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await admin_action_model_1.default.create({ adminId, targetType: "settings", action: "settings.spotlight_published", metadata: { expertUserId, merchantUserId, publishedAt } });
    return { expertUserId: config?.spotlightExpertUserId, merchantUserId: config?.spotlightMerchantUserId, publishedAt };
};
exports.publishSpotlight = publishSpotlight;
