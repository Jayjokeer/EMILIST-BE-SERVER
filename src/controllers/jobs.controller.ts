import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob } from "../interfaces/jobs.interface";

export const createJobController = catchAsync( async (req: Request, res: Response) => {
    const job: IJob = req.body;
    const files = req.files as Express.Multer.File[];

  if (files && files.length > 0) {
    const fileUrls = files.map(file => file.path);
    job.jobFiles = fileUrls;
  }

    const data = await jobService.createJob(job);

    successResponse(res,StatusCodes.CREATED, data);
});
