import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob } from "../interfaces/jobs.interface";
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError } from "../errors/error";

export const createJobController = catchAsync( async (req: JwtPayload, res: Response) => {
    const job: IJob = req.body;
    const files = req.files as Express.Multer.File[];

  if (files && files.length > 0) {
    const fileUrls = files.map(file => file.path);
    job.jobFiles = fileUrls;
  }
    const user = req.user._id;
    job.userId = user;
    const data = await jobService.createJob(job);

    successResponse(res,StatusCodes.CREATED, data);
});

export const allUserJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { page = 1, limit = 10 } = req.query; 
    const data = await jobService.fetchAllUserJobs(req.user.id, Number(page), Number(limit));
    successResponse(res, StatusCodes.OK, data);
  });
  

export const allJobsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { page = 1, limit = 10 } = req.query; 
    
    const userId = req.query.userId ? req.query.userId : null; 
    const data = await jobService.fetchAllJobs(Number(page), Number(limit), userId);
    successResponse(res, StatusCodes.OK, data);
  });

export const fetchSinlgeJobController = catchAsync( async (req: Request, res: Response) => {
    const { id } = req.query;
    if(!id){
        throw new NotFoundError("Id required!");
    };
    const data = await jobService.fetchJobById(String(id));
    successResponse(res,StatusCodes.OK, data);
});

export const likeJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id;
  const { jobId } = req.params;

    
    const job = await jobService.fetchJobById(String(jobId));
    if (!job) {
        throw new NotFoundError("Job not found!");
    }


    const existingLike = await jobService.ifLikedJob(jobId, userId);
    if(existingLike) {
        throw new BadRequestError("Job previously liked!");
    }

    
    const data = await jobService.createJobLike({job: jobId, user: userId});
 

    successResponse(res,StatusCodes.CREATED, data);
});

export const fetchLikedJobsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const { page = 1, limit = 10 } = req.query;
  
    const data = await jobService.fetchLikedJobs(userId, Number(page), Number(limit));
    successResponse(res, StatusCodes.OK, data);
  });
  