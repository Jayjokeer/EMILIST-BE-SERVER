import { Request, Response } from 'express';
import * as planService from '../services/plan.service';
import { catchAsync } from '../errors/error-handler';
import { StatusCodes } from 'http-status-codes';
import { successResponse } from '../helpers/success-response';
import { PlanEnum } from '../enums/plan.enum';
import { BadRequestError } from '../errors/error';

export const createPlanController = catchAsync(async (req: Request, res: Response) => {
    const { name, price, duration, perks, offers } = req.body;
    const data = await planService.createPlan({ name, price, duration, perks, offers });
    return  successResponse(res,StatusCodes.CREATED, data);

});

export const getPlansController = catchAsync(async (req: Request, res: Response) => {
    const {duration} = req.query;
    if(!duration){
        throw new BadRequestError('Duration is required');
    }
    let data; 
    const plans = await planService.getPlans();
    if (duration === 'yearly') {
        const data = plans.map((plan) => {

            if (plan.name === PlanEnum.basic){
                return plan;
            }else {
                plan.price = plan.price * 12; 
                return plan;
            }
        });

        return successResponse(res, StatusCodes.OK, data);
    }
    data = plans;
    return successResponse(res,StatusCodes.OK, data);
});
