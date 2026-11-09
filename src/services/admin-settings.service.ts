import mongoose from "mongoose";
import AppConfig from "../models/app-config.model";
import Plan from "../models/plan.model";
import Admin from "../models/admin.model";
import Users from "../models/users.model";
import Business from "../models/business.model";
import Product from "../models/product.model";
import AdminAction from "../models/admin-action.model";
import { BadRequestError, NotFoundError } from "../errors/error";

const getConfig = () => AppConfig.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true, setDefaultsOnInsert: true });

export const fetchAdminSettings = async (search = "") => {
  const regex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : undefined;
  const userFilter = regex ? { $or: [{ firstName: regex }, { lastName: regex }, { userName: regex }, { email: regex }] } : {};
  const [config, plans, admins, candidateUsers] = await Promise.all([
    getConfig(),
    Plan.find().sort({ price: 1 }).lean(),
    Admin.find().select("fullName email profileImage department role jobTitle permissions status createdAt updatedAt").sort({ createdAt: 1 }).lean(),
    Users.find(userFilter).select("firstName lastName userName email displayImage uniqueId").limit(40).lean(),
  ]);
  const ids = candidateUsers.map((user: any) => user._id);
  const [businesses, merchants] = await Promise.all([
    Business.find({ userId: { $in: ids } }).select("userId businessName reviews").populate("reviews", "rating").lean(),
    Product.aggregate([{ $match: { userId: { $in: ids }, isDeleted: { $ne: true } } }, { $group: { _id: "$userId", listings: { $sum: 1 }, unitsSold: { $sum: "$totalUnitsSold" } } }]),
  ]);
  const businessByUser = new Map(businesses.map((business: any) => [String(business.userId), business]));
  const merchantByUser = new Map(merchants.map((merchant: any) => [String(merchant._id), merchant]));
  const candidates = candidateUsers.map((user: any) => {
    const expert: any = businessByUser.get(String(user._id));
    const ratings = expert?.reviews?.map((review: any) => Number(review.rating || 0)).filter((rating: number) => rating > 0) || [];
    return {
      ...user,
      expert: expert ? { ...expert, averageRating: ratings.length ? Number((ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length).toFixed(1)) : 0, reviewCount: ratings.length } : null,
      merchant: merchantByUser.get(String(user._id)) || null,
    };
  }).filter((user: any) => user.expert || user.merchant);
  return { platform: config, subscriptions: plans, spotlight: { expertUserId: (config as any)?.spotlightExpertUserId || null, merchantUserId: (config as any)?.spotlightMerchantUserId || null, publishedAt: (config as any)?.spotlightPublishedAt || null, candidates }, roles: admins };
};

export const updatePlatformSettings = async (payload: Record<string, unknown>, adminId: string) => {
  const previous = await getConfig();
  const minimum = Number(payload.minimumWithdrawalAmount ?? (previous as any)?.minimumWithdrawalAmount ?? 0);
  const maximum = Number(payload.maximumWithdrawalAmount ?? (previous as any)?.maximumWithdrawalAmount ?? 0);
  if (maximum < minimum) throw new BadRequestError("Maximum withdrawal amount must be greater than or equal to the minimum withdrawal amount");
  const config = await AppConfig.findOneAndUpdate({}, { $set: payload }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  await AdminAction.create({ adminId, targetType: "settings", action: "settings.platform_updated", previousState: previous?.toObject(), newState: config?.toObject() });
  return config;
};

export const updateSubscriptionPrices = async (plans: Array<{ name: string; price: number; isActive?: boolean }>, adminId: string) => {
  const existing = await Plan.find({ name: { $in: plans.map((plan) => plan.name) } }).lean();
  const found = new Set(existing.map((plan: any) => plan.name));
  const missing = plans.map((plan) => plan.name).filter((name) => !found.has(name));
  if (missing.length) throw new NotFoundError(`Subscription plan(s) not found: ${missing.join(", ")}`);
  await Plan.bulkWrite(plans.map((plan) => ({ updateOne: { filter: { name: plan.name }, update: { $set: { price: plan.price, ...(plan.isActive === undefined ? {} : { isActive: plan.isActive }) } } } })));
  await AdminAction.create({ adminId, targetType: "settings", action: "settings.subscription_prices_updated", previousState: existing, newState: plans });
  return Plan.find().sort({ price: 1 }).lean();
};

export const publishSpotlight = async (expertUserId: string, merchantUserId: string, adminId: string) => {
  if (!mongoose.isValidObjectId(expertUserId) || !mongoose.isValidObjectId(merchantUserId)) throw new BadRequestError("Valid expert and merchant user ids are required");
  const [expert, merchant] = await Promise.all([Business.exists({ userId: expertUserId }), Product.exists({ userId: merchantUserId, isDeleted: { $ne: true } })]);
  if (!expert) throw new BadRequestError("Selected expert does not have an expert profile");
  if (!merchant) throw new BadRequestError("Selected merchant does not have a material listing");
  const publishedAt = new Date();
  const config = await AppConfig.findOneAndUpdate({}, { $set: { spotlightExpertUserId: expertUserId, spotlightMerchantUserId: merchantUserId, spotlightPublishedAt: publishedAt, spotlightPublishedBy: adminId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await AdminAction.create({ adminId, targetType: "settings", action: "settings.spotlight_published", metadata: { expertUserId, merchantUserId, publishedAt } });
  return { expertUserId: (config as any)?.spotlightExpertUserId, merchantUserId: (config as any)?.spotlightMerchantUserId, publishedAt };
};
