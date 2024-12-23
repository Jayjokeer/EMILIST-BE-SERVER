import { Request, Response } from 'express';
import * as planService from '../services/plan.service';
import * as subscriptionService from '../services/subscription.service';
import { JwtPayload } from 'jsonwebtoken';
import { catchAsync } from '../errors/error-handler';
import { NotFoundError } from '../errors/error';
import { StatusCodes } from 'http-status-codes';
import { successResponse } from '../helpers/success-response';

export const subscribeToPlan = catchAsync( async (req:JwtPayload, res: Response) => {
    const { planId } = req.body;
    const userId = req.user._id;

    const plan = await planService.getPlanById(planId);
    if (!plan) throw new NotFoundError('Plan not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);

    const data = subscriptionService.createSubscription({
      userId,
      planId,
      perks: plan.perks,
      startDate,
      endDate,
    });

    return  successResponse(res,StatusCodes.CREATED, data);
});

export const getUserSubscription = catchAsync( async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;

    const data = await subscriptionService.getActiveSubscription(userId);

    if (!data) throw new NotFoundError('Subscription not found');

return successResponse(res, StatusCodes.OK, data);
});

// Additional controllers: cancelSubscription, renewSubscription
