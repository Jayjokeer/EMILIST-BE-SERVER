import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import Subscription from '../models/subscription.model';
import Appconfig from '../models/app-config.model';
import Promotion from '../models/promotion.model';
import Users from '../models/users.model';
import Plan from '../models/plan.model';

export const createSubscription = async (data: any) => {
    return await Subscription.create(data);
};

export const getActiveSubscription = async (userId: string) => {
    return await Subscription.findOne({ userId, status: SubscriptionStatusEnum.active }).populate('planId');
};
export const getActiveSubscriptionWithoutDetails = async (userId: string) => {
    return await Subscription.findOne({ userId, status: SubscriptionStatusEnum.active });
};
export const getSubscriptionById = async (subscriptionId: string) => {
    return await Subscription.findById(subscriptionId);
};
export const findExpiredSubscriptions = async () => {
    const currentDate = new Date();
    return await Subscription.find({
        endDate: { $lte: currentDate },
        status: SubscriptionStatusEnum.active,
        
    });

};

export const fetchAllSubscriptionsAdmin = async(limit: number, page: number, search: string, status: string)=>{
const skip = (page - 1) * limit;

    const filters: any = {};
    if (status) filters.status = status;

    if (search) {
      const users = await Users.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const plans = await Plan.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      filters.$or = [
        { userId: { $in: users.map(u => u._id) } },
        { planId: { $in: plans.map(p => p._id) } },
      ];
    }

    const subscriptions = await Subscription.find(filters)
      .populate("userId", "fullName userName email")
      .populate("planId", "name price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalSubscriptions = await Subscription.countDocuments(filters);

    const planCounts = await Subscription.aggregate([
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

export const fetchCostPerClick = async ()=>{
    const config = await Appconfig.findOne();

    return config!.costPerClick;
};

export const createPromotion = async (data: any)=>{
    return await Promotion.create(data);
};
export const fetchAllUserSubscriptionsAdmin = async(limit: number, page: number, userId: string)=>{
    const skip = (page - 1) * limit;
    const subscriptions = await Subscription.find({userId: userId}).skip(skip).limit(limit).populate('planId', 'name price');
    const totalSubscriptions = await Subscription.countDocuments({userId: userId});
    return {subscriptions ,  totalSubscriptions};
};

export const getAllUsersSubscription = async (userId: string) => {
    return await Subscription.findOne({ userId}).populate('planId');
};