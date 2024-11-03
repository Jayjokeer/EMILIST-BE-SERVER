import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob, IMilestone, IUpdateJob } from "../interfaces/jobs.interface";
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import { IProject } from "../interfaces/project.interface";
import * as projectService from "../services/project.service";
import { ProjectStatusEnum } from "../enums/project.enum";
import { JobStatusEnum, JobType, MilestoneEnum } from "../enums/jobs.enum";
import * as authService from "../services/auth.service";
import { sendEmail } from "../utils/send_email";
import { directJobApplicationMessage } from "../utils/templates";
import mongoose from "mongoose";

export const createJobController = catchAsync( async (req: JwtPayload, res: Response) => {
    const job: IJob = req.body;
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const fileObjects = files.map((file) => ({
        id: new mongoose.Types.ObjectId(),
        url: file.path, 
      }));
      job.jobFiles = fileObjects;
    }

  if(job.type == JobType.direct && (job.email || job.userName)){

    const user = await authService.findUserByEmailOrUserName(job.email, job.userName);
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
    if(job.status !== JobStatusEnum.pending){
      throw new BadRequestError("You can only apply to a pending job!")
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
    job.milestones
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
      const fileObjects = files.map((file) => ({
        id: new mongoose.Types.ObjectId(), 
        url: file.path, 
      }));
      updates.jobFiles = [...(job.jobFiles || []), ...fileObjects];
    }
     
    Object.keys(updates).forEach((key) => {
      (job as any)[key] = updates[key as keyof IUpdateJob];
    });

    await job.save();
    const data = await jobService.fetchJobById(jobId);

    successResponse(res, StatusCodes.OK, data);
  });

  export const jobStatusController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {projectId} = req.params;
    const {status} = req.body;
    const project = await projectService.fetchProjectById(projectId);

    if(!project){
      throw new NotFoundError("Application not found!");
    }
    if(project.creator != userId){
      throw new UnauthorizedError("UnAuthorized!")
    }
    const job = await jobService.fetchJobById(String(project.job));
    if(!job) throw new NotFoundError("Job not found!");

    project.status = status;

    if (status == ProjectStatusEnum.pending){
    job.status = JobStatusEnum.pending;

    }else if (status == ProjectStatusEnum.accepted){
      job.status = JobStatusEnum.active;
      job.acceptedApplicationId = projectId;
      project.acceptedAt = new Date();
      job.startDate = project.acceptedAt || new Date();
      job.milestones[0].status = MilestoneEnum.active;

      if (job.type === JobType.biddable && project.biddableDetails) {
        job.maximumPrice = project.biddableDetails.maximumPrice;
  
        project.biddableDetails.milestones.forEach((projectMilestone: { milestoneId: string; amount: number; achievement: string }) => {
          const jobMilestone = job.milestones.find((m: any) => m._id.toString() === projectMilestone.milestoneId);
  
          if (jobMilestone) {
            jobMilestone.amount = projectMilestone.amount;
            jobMilestone.achievement = projectMilestone.achievement;

          }
        });
      }
      await projectService.updateRejectProject(projectId, String(job._id));
    }else if(status == ProjectStatusEnum.rejected){
      project.rejectedAt = new Date();
    }else if(status == "paused"){
      job.status = JobStatusEnum.paused;
      job.pausedDate= new Date();

      job.milestones.forEach((milestone: IMilestone) => {
        if (milestone.status !== MilestoneEnum.completed) {
          milestone.status = MilestoneEnum.paused;
        }
      });
    
    }

    await project.save();
    await job.save()
    const data = await jobService.fetchJobById(String(job._id));
    successResponse(res, StatusCodes.OK, data);
  });
  // export const checkOverdueMilestones = async () => {
  //   const job = await jobs.find({ 'milestones.status': MilestoneEnum.pending });
  //   const now = new Date();
  
  //   job.forEach(async (job: IJob) => {
  //     let milestonesUpdated = false;
  
  //     job.milestones.forEach((milestone: IMilestone) => {
  //       if (milestone.status === MilestoneEnum.pending && milestone.timeFrame && job.startDate) {
  //         const dueDate = new Date(job.startDate);
  //         dueDate.setDate(dueDate.getDate() + Number(milestone.timeFrame.number));
  //         if (dueDate < now) {
  //           milestone.status = MilestoneEnum.overdue;
  //           milestonesUpdated = true;
  //         }
  //       }
  //     });
  
  //     if (milestonesUpdated) {
  //       await job.save();
  //     }
  //   });
  // };
  export const fetchJobByStatusController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const {status} = req.query;
    let data:any;
    if(status == JobStatusEnum.pending){
      const jobs = await jobService.fetchJobByUserIdAndStatus(userId, status );
      if(!jobs)  throw new NotFoundError("No jobs found!");
      data = jobs;
    }else if(status == JobStatusEnum.active){
      const jobs = await jobService.fetchJobByUserIdAndStatus(userId, status as JobStatusEnum );
      if (!jobs || jobs.length === 0) throw new NotFoundError("No jobs found!");

      data = jobs.map((job) => {
        const totalMilestones = job.milestones.length;
        let milestoneStartDate = new Date(job.startDate || new Date());
        let milestoneEndDate = new Date(milestoneStartDate);
  
        let milestoneProgress = "0/0"; 
  
        for (let i = 0; i < totalMilestones; i++) {
          const milestone = job.milestones[i];
          const duration = parseInt(milestone.timeFrame.number, 10) || 0;
  
          switch (milestone.timeFrame.period) {
            case "days":
              milestoneEndDate.setDate(milestoneStartDate.getDate() + duration);
              break;
            case "weeks":
              milestoneEndDate.setDate(milestoneStartDate.getDate() + duration * 7);
              break;
            case "months":
              milestoneEndDate.setMonth(milestoneStartDate.getMonth() + duration);
              break;
            default:
              break; 
          }
  
          if (milestone.status === MilestoneEnum.active || milestone.status === MilestoneEnum.pending) {
            milestoneProgress = `${i + 1}/${totalMilestones}`;
            break;
          }
  
          milestoneStartDate = new Date(milestoneEndDate);
        }
  
        return {
          ...job.toObject(),
          milestoneProgress,
          startDate: milestoneStartDate,
          dueDate: milestoneEndDate,
        };
      });
      
    }

    successResponse(res, StatusCodes.OK, data);
  });
  export const deleteFileController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {jobId, fileId} = req.params;
    const job = await jobService.fetchJobById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    job.jobFiles = job.jobFiles.filter((file: any) => file.id.toString() !== fileId);

    await job.save();

    successResponse(res, StatusCodes.OK, "Image deleted successfully");
  });

  export const acceptDirectJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {projectId} = req.params;
    const {status} = req.body;

    const project = await projectService.fetchProjectById(projectId);

    if(!project){
      throw new NotFoundError("Application not found!");
    }

    const job = await jobService.fetchJobById(String(project.job));
    if(!job)  {
      throw new NotFoundError("Job not found!")
    }
    if(status == ProjectStatusEnum.accepted){
      job.status = JobStatusEnum.active;
      job.milestones[0].status = MilestoneEnum.active;
      project.status= ProjectStatusEnum.accepted;

      project.directJobStatus= ProjectStatusEnum.accepted;
    }else if(status == ProjectStatusEnum.rejected){
      project.status= ProjectStatusEnum.rejected;
      project.directJobStatus= ProjectStatusEnum.rejected;
      job.acceptedApplicationId = undefined;
    };

    await project.save();
    await job.save();

    successResponse(res, StatusCodes.OK, "Image deleted successfully");
  });