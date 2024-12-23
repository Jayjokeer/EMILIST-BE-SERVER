import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import Subscription from '../models/subscription.model';

export const createSubscription = async (data: any) => {
    return await Subscription.create(data);
};

export const getActiveSubscription = async (userId: string) => {
    return await Subscription.findOne({ userId, status: SubscriptionStatusEnum.active }).populate('planId');
};

export const getSubscriptionById = async (subscriptionId: string) => {
    return await Subscription.findById(subscriptionId);
};