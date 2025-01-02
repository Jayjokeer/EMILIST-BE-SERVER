import { Request, Response } from 'express';
import * as planService from '../services/plan.service';
import { catchAsync } from '../errors/error-handler';
import { StatusCodes } from 'http-status-codes';
import { successResponse } from '../helpers/success-response';

export const createPlanController = catchAsync(async (req: Request, res: Response) => {
    const { name, price, duration, perks, offers } = req.body;
    const data = await planService.createPlan({ name, price, duration, perks, offers });
    return  successResponse(res,StatusCodes.CREATED, data);

});

export const getPlansController = catchAsync(async (req: Request, res: Response) => {
    const data = await planService.getPlans();
    return successResponse(res,StatusCodes.OK, data);
});
