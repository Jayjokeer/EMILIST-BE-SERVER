import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob, IUpdateJob } from "../interfaces/jobs.interface";
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError } from "../errors/error";
import { IProject } from "../interfaces/project.interface";
import * as projectService from "../services/project.service";
import { ProjectStatusEnum } from "../enums/project.enum";
import { JobStatusEnum, JobType } from "../enums/jobs.enum";
import * as authService from "../services/auth.service";
import { sendEmail } from "../utils/send_email";
import { directJobApplicationMessage } from "../utils/templates";

export const createJobController = catchAsync( async (req: JwtPayload, res: Response) => {
    const job: IJob = req.body;
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const fileUrls = files.map(file => file.path);
      job.jobFiles = fileUrls;
    }

  if(job.type == JobType.direct && job.uniqueId){

    const user = await authService.findUserByUniqueId(job.uniqueId);
    if(!user) throw new NotFoundError("User not found!");
    
      const userId = req.user.id;
      job.userId = userId;
      job.applications = [];
      job.applications!.push(String(user._id));
      const data = await jobService.createJob(job);

      const payload:any = {
        job: data._id,
        user: user._id,
        creator: userId,
        directJobStatus: ProjectStatusEnum.pending,
      };
       await projectService.createProject(payload);

       const { html, subject } = directJobApplicationMessage(user.userName, req.user.userName, String(data._id));
       await sendEmail(req.user.email, subject, html); 
      successResponse(res,StatusCodes.CREATED, data);

  } else {
    const user = req.user._id;
    job.userId = user;
    const data = await jobService.createJob(job);

    successResponse(res,StatusCodes.CREATED, data);
}
});

export const allUserJobController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { page = 1, limit = 10, search = null, fields = '' } = req.query;

  const data = await jobService.fetchAllUserJobs(
    req.user.id,
    Number(page),
    Number(limit),
    search as string,
    (fields as string).split(',').filter(Boolean)
  );

  successResponse(res, StatusCodes.OK, data);
});

export const allJobsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { page = 1, limit = 10 } = req.query; 
    
    const userId = req.query.userId ? req.query.userId : null; 
    const search = req.query.search as string || null;
    const specificFields = req.query.fields ? (req.query.fields as string).split(',') : [];
    
    const data = await jobService.fetchAllJobs(Number(page), Number(limit), userId, search, specificFields );
    successResponse(res, StatusCodes.OK, data);
  });

export const fetchSinlgeJobController = catchAsync( async (req: Request, res: Response) => {
    const { id } = req.query;
    if(!id){
        throw new NotFoundError("Id required!");
    };
    const data = await jobService.fetchJobByIdWithDetails(String(id));



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

  export const unlikeJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {jobId} = req.params;
     const data = await jobService.unlikeJob(jobId, userId);
    successResponse(res, StatusCodes.OK, data);
  });
  
  export const applyForJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id;
    const { jobId, type, maximumPrice, milestones } = req.body;
  
   
    const job = await jobService.fetchJobById(String(jobId));
    if (!job) {
      throw new NotFoundError("Job not found!");
    }
    if (userId === job.userId) {
      throw new BadRequestError("You cannot apply to your own job!");
    }
  
    
    const payload: any = {
      job: jobId,
      user: userId,
      creator: job.userId,
    };
  
    
    if (type === JobType.biddable) {
      if (!maximumPrice || !milestones) {
        throw new BadRequestError("Both maximumPrice and milestones are required for biddable jobs.");
      }
  
      payload.biddableDetails = {
        maximumPrice,
        milestones: milestones.map((milestone: any) => ({
          milestoneId: milestone.milestoneId,
          amount: milestone.amount,
          achievement: milestone.achievement,
        })),
      };
    }
  
   
    const projectData = await projectService.createProject(payload);
  
    
    job.applications!.push(String(projectData._id));
    await job.save();
  
    
    successResponse(res, StatusCodes.CREATED, projectData);
  });
  
  
  export const deleteJobApplicationController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {projectId} = req.params;
    const project = await projectService.fetchProjectById(projectId);

    if(!project){
      throw new NotFoundError("Application not found!");
    }
    if(project.status !== ProjectStatusEnum.pending){
      throw new BadRequestError("You can only withdraw a pending application!");
    }
    await jobService.deleteJobApplication(project.job, projectId);
    await projectService.deleteProject(projectId, userId);
    successResponse(res, StatusCodes.OK, "Application withdrawn");
  });
  export const deleteJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {jobId} = req.params;
    const job = await jobService.fetchJobById(jobId);
    if(!job) throw new NotFoundError("Job not found!");
    if(job.status !== JobStatusEnum.pending){
      throw new BadRequestError("You can only delete a pending job!");
    }
    await jobService.deleteJobById(jobId, userId);
    successResponse(res, StatusCodes.OK, "Job deleted successfully");
  });

  export const updateJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {jobId} = req.params;
    const files = req.files as Express.Multer.File[];
    const updates: IUpdateJob = req.body;

    const job = await jobService.fetchJobById(jobId);
    if(!job) throw new NotFoundError("Job not found!");
    if(job.status !== JobStatusEnum.pending){
      throw new BadRequestError("You can only edit a pending job!");
    }
    if (files && files.length > 0) {
      const filePaths = (files as Express.Multer.File[]).map((file) => file.path);
      updates.jobFiles = [...(job.jobFiles || []), ...filePaths];

    }    
    Object.keys(updates).forEach((key) => {
      (job as any)[key] = updates[key as keyof IUpdateJob];
    });

    await job.save();
    const data = await jobService.fetchJobById(jobId);

    successResponse(res, StatusCodes.OK, data);
  });