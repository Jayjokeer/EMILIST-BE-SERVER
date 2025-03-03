import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import Subscription from '../models/subscription.model';
import Appconfig from '../models/app-config.model';
import Promotion from '../models/promotion.model';

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

export const fetchAllSubscriptionsAdmin = async(limit: number, page: number)=>{
    const skip = (page - 1) * limit;
    const subscriptions = await Subscription.find().skip(skip).limit(limit);
    const totalSubscriptions = await Subscription.countDocuments();
    return {subscriptions ,  totalSubscriptions};
};

export const fetchCostPerClick = async ()=>{
    const config = await Appconfig.findOne();

    return config!.costPerClick;
};

export const createPromotion = async (data: any)=>{
    return await Promotion.create(data);
};