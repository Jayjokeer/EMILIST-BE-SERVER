import { PlanEnum } from '../enums/plan.enum';
import Plan from '../models/plan.model';

export const createPlan = async (data: any) => {
    return await Plan.create(data);
};

export const getPlans = async () => {
    return await Plan.find({ isActive: true });
};

export const getPlanById = async (planId: string) => {
    return await Plan.findById(planId);
};
export const getPlanByName = async (name: PlanEnum ) => {
    return await Plan.findOne({ name });
};