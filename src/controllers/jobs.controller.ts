import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob } from "../interfaces/jobs.interface";

export const createJobController = catchAsync( async (req: Request, res: Response) => {
    const job: IJob = req.body;
    const data = await jobService.createJob(job);

    successResponse(res,StatusCodes.CREATED, data);
});
