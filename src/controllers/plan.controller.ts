import { Request, Response } from 'express';
import * as planService from '../services/plan.service';
import { catchAsync } from '../errors/error-handler';
import { StatusCodes } from 'http-status-codes';
import { successResponse } from '../helpers/success-response';
import { PlanEnum } from '../enums/plan.enum';
import { BadRequestError } from '../errors/error';
import { SubscriptionPeriodEnum } from '../enums/suscribtion.enum';

export const createPlanController = catchAsync(async (req: Request, res: Response) => {
    const { name, price, duration, perks, offers } = req.body;
    const data = await planService.createPlan({ name, price, duration, perks, offers });
    return  successResponse(res,StatusCodes.CREATED, data);

});

export const serializePlanForDuration = (plan: any, duration: SubscriptionPeriodEnum) => {
    const serialized = typeof plan.toObject === 'function' ? plan.toObject() : { ...plan };
    const monthlyPrice = Number(serialized.price);
    return {
        ...serialized,
        price: duration === SubscriptionPeriodEnum.yearly && serialized.name !== PlanEnum.basic
            ? monthlyPrice * 12
            : monthlyPrice,
        monthlyPrice,
        billingPeriod: duration,
    };
};

export const getPlansController = catchAsync(async (req: Request, res: Response) => {
    const duration = String(req.query.duration || SubscriptionPeriodEnum.monthly).toLowerCase();
    if (!Object.values(SubscriptionPeriodEnum).includes(duration as SubscriptionPeriodEnum)) {
        throw new BadRequestError('Duration must be monthly or yearly');
    }

    const plans = await planService.getPlans();
    const data = plans.map((plan: any) => serializePlanForDuration(plan, duration as SubscriptionPeriodEnum));

    return successResponse(res,StatusCodes.OK, data);
});
