import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import Subscription from '../models/subscription.model';

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
