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
import { JobStatusEnum, JobType, MilestoneEnum, MilestonePaymentStatus, QuoteStatusEnum } from "../enums/jobs.enum";
import * as authService from "../services/auth.service";
import { sendEmail } from "../utils/send_email";
import { directJobApplicationMessage, postQuoteMessage, requestForQuoteMessage } from "../utils/templates";
import mongoose from "mongoose";
import moment from "moment";

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

      const data = await jobService.createJob(job);

      const payload:any = {
        job: data._id,
        user: user._id,
        creator: userId,
        directJobStatus: ProjectStatusEnum.pending,
      };
       const project = await projectService.createProject(payload);
       data.applications = [];
       data.applications!.push(String(project._id));
       data.acceptedApplicationId = String(project._id);
       data.save();
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

export const fetchSingleJobController = catchAsync( async (req: Request, res: Response) => {
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


    if (status == ProjectStatusEnum.pending){
    job.status = JobStatusEnum.pending;
    project.status = status;

    }else if (status == ProjectStatusEnum.accepted){
      job.status = JobStatusEnum.active;
      job.acceptedApplicationId = projectId;
      project.acceptedAt = new Date();
      job.startDate = project.acceptedAt || new Date();
      job.milestones[0].status = MilestoneEnum.active;
      project.status = status;

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
      project.status = status;

    }else if(status == ProjectStatusEnum.pause){
      job.status = JobStatusEnum.paused;
      job.pausedDate= new Date();

      job.milestones.forEach((milestone: IMilestone) => {
        if (milestone.status !== MilestoneEnum.completed && milestone.status !== MilestoneEnum.pending) {
          milestone.status = MilestoneEnum.paused;
        }
      });
    
    } else if (status == ProjectStatusEnum.unpause){
      job.status = JobStatusEnum.active;
      job.milestones.forEach((milestone: IMilestone) => {
        if (milestone.status === MilestoneEnum.paused) {
          milestone.status = MilestoneEnum.active; 
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
    const { status } = req.query;
    let data: any;
  
    if (status === JobStatusEnum.pending) {
      const jobs = await jobService.fetchJobByUserIdAndStatus(userId, status);
      data = jobs;
    } else if (status === JobStatusEnum.active || status === JobStatusEnum.paused) {
      const jobs = await jobService.fetchJobByUserIdAndStatus(userId, status as JobStatusEnum);
      data = jobs.map((job) => {
        const totalMilestones = job.milestones.length;
        let milestoneStartDate = new Date(job.startDate || new Date());
        let currentMilestoneDueDate = new Date(milestoneStartDate);
        let overallDueDate = new Date(milestoneStartDate); 
  
        let milestoneProgress = "0/0"; 
  
        for (let i = 0; i < totalMilestones; i++) {
          const milestone = job.milestones[i];
          const duration = parseInt(milestone.timeFrame.number, 10) || 0;
  
          const durationMs =
            milestone.timeFrame.period === 'days'
              ? duration * 86400000 
              : milestone.timeFrame.period === 'weeks'
              ? duration * 604800000 
              : duration * 2629800000; 
  
          overallDueDate = new Date(overallDueDate.getTime() + durationMs);
  
          if (milestone.status === MilestoneEnum.active || milestone.status === MilestoneEnum.paused) {
            milestoneProgress = `${i + 1}/${totalMilestones}`;
            currentMilestoneDueDate = new Date(overallDueDate); 
            break;
          }
  
          milestoneStartDate = new Date(overallDueDate);
        }
  
        return {
          ...job.toObject(),
          milestoneProgress,
          startDate: milestoneStartDate,
          currentMilestoneDueDate,
          overallDueDate, 
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
    const user = req.user;
    const project = await projectService.fetchProjectById(projectId);
    console.log(user)
    if(!project){
      throw new NotFoundError("Application not found!");
    }
    if(String(project.user) !== String(user.id) ){
      throw new BadRequestError("Unauthorized!");
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
      job.status = JobStatusEnum.pending;
      job.type = JobType.regular;
    };
    await project.save();
    await job.save();

    successResponse(res, StatusCodes.OK, "Status changed successfully");
  });
  export const fetchUserAppliedJobsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const user = req.user;
    const{status} = req.query;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;
    const statusEnum = status ? (status as JobStatusEnum) : null;

   const data = await jobService.fetchUserJobApplications(user.id, skip, limit,statusEnum, page)
    successResponse(res, StatusCodes.OK, data);
  });
  export const fetchApplicationByStatusController  = catchAsync(async (req: JwtPayload, res: Response) => {
    const user = req.user;
    const{status} = req.query;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

   const data = await jobService.fetchUserApplications(user.id, skip, limit,status, page)
    successResponse(res, StatusCodes.OK, data);
  });
  export const updateMilestoneStatusController = catchAsync(async (req: JwtPayload, res: Response) => {
    const user = req.user;
    const {milestoneId, jobId} = req.params;
    const {status, bank, accountNumber, accountName, paymentMethod, note} = req.body;
    const job = await jobService.fetchJobById(String(jobId));
    if(!job)  {
      throw new NotFoundError("Job not found!")
    }
    if(job.status == JobStatusEnum.pending){
      throw new BadRequestError("You cannot update a pending job milestone");
    }
    const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
    if(!project){
      throw new NotFoundError("Application not found!");
    }
    if(String(project.user) !== String(user.id)){
      throw new UnauthorizedError("Unauthorized!");
    }
    const milestoneIndex = job.milestones.findIndex(
      (milestone: any) => String(milestone._id) === String(milestoneId)
    );
  
    if (milestoneIndex === -1) {
      throw new NotFoundError("Milestone not found");
    }
  
    const milestone = job.milestones[milestoneIndex];
    
    milestone.status = status as MilestoneEnum;
  
    if (status === MilestoneEnum.completed) {
      const nextMilestone = job.milestones[milestoneIndex + 1];
      if (nextMilestone && nextMilestone.status === MilestoneEnum.pending) {
        nextMilestone.status = MilestoneEnum.active;
      }

      milestone.accountDetails = {
        bank,
        accountNumber,
        accountName,
        paymentMethod,
        note
      };
    }
    
    if(!milestone) throw new NotFoundError("Milestone not found");
    milestone.status = status as  MilestoneEnum;
    await job.save();
    const data = await jobService.fetchJobById(String(jobId));

    successResponse(res, StatusCodes.OK, data);
  });
  export const requestForQuoteController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {jobId} = req.params;
    const loggedInUser =  req.user;
    const job = await jobService.fetchJobById(String(jobId));
    if(!job)  {
      throw new NotFoundError("Job not found!")
    }
    if(String(loggedInUser.id) !== String(job.userId)){
      throw new UnauthorizedError("Unauthorized");

    }
    if (job.status !== JobStatusEnum.active && job.status !== JobStatusEnum.paused) {
      throw new BadRequestError("You can only request for quote on an active or paused job!");
    }
    job.isRequestForQuote = true;

    const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
    const user = await authService.findUserById(String(project?.user));
    if(!user) throw new NotFoundError("user not found!");
    job.save();

    const { html, subject } = requestForQuoteMessage(user.userName, req.user.userName, String(job._id));
    await sendEmail(user.email, subject, html); 

    successResponse(res, StatusCodes.OK, 'Request for quote sent successfully');
  });
  export const postQuoteController = catchAsync(async (req: JwtPayload, res: Response) => {
    const loggedInUser =  req.user;
    const {milestones, jobId, totalAmount} = req.body;
    const job = await jobService.fetchJobById(String(jobId));
    if(!job)  {
      throw new NotFoundError("Job not found!")
    }
    if(String(loggedInUser.id) === String(job.userId)){
      throw new UnauthorizedError("You cannot post a quote on your own job!");

    }
    if (job.status !== JobStatusEnum.active && job.status !== JobStatusEnum.paused) {
      throw new BadRequestError("You can only post quote on an active or paused job!");
    }
    if(!job.isRequestForQuote){
      throw new BadRequestError("You cannot post a quote on this job");
    }
    const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
    if(!project){
      throw new NotFoundError("Project not found!");
    }
    project.quote = {
      milestones: milestones.map((milestone: any) => ({
        milestoneId: milestone.milestoneId,
        amount: milestone.amount,
        achievement: milestone.achievement,
      })),
      totalAmount: totalAmount,
      postedAt: new Date()
    }
    
     await project.save();
    const user = await authService.findUserById(String(job.userId));
    if(!user) throw new NotFoundError("user not found!");
   await job.save();

    const { html, subject } = postQuoteMessage(user.userName, req.user.userName, String(job._id));
    await sendEmail(user.email, subject, html); 

    successResponse(res, StatusCodes.OK, 'Quote sent successfully');
  });

  export const acceptQuoteController = catchAsync(async (req: JwtPayload, res: Response) => {
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

    project.quote.status = status as QuoteStatusEnum;
    if (status == QuoteStatusEnum.accepted){
      job.status = JobStatusEnum.active;
      project.quote.acceptedAt = new Date();

      if (job.type === JobType.biddable) {
        job.maximumPrice = project.quote.totalAmount;
      } else {
        job.budget = project.quote.totalAmount;
      };

        project.quote.milestones.forEach((projectMilestone: { milestoneId: string; amount: number; achievement: string }) => {
          const jobMilestone = job.milestones.find((m: any) => m._id.toString() === projectMilestone.milestoneId);
  
          if (jobMilestone) {
            jobMilestone.amount = projectMilestone.amount;
            jobMilestone.achievement = projectMilestone.achievement;

          }
        });
      }else if(status == QuoteStatusEnum.rejected){
      project.quote.rejectedAt = new Date();
    }

    await project.save();
    await job.save()
    const data = await jobService.fetchJobById(String(job._id));
    successResponse(res, StatusCodes.OK, data);
  });
  export const updateMilestonePaymentController = catchAsync( async (req:JwtPayload, res: Response) => {
    const {amountPaid, paymentMethod, date, jobId,milestoneId } = req.body;

    if(!jobId && !milestoneId){
        throw new NotFoundError("Ids required!");
    };
    const job = await jobService.fetchJobById(String(jobId));
    if(!job) throw new NotFoundError("Job not found!");
    if(String(job.userId) !== String(req.user.id)) throw new BadRequestError("Unauthorized!");
    const milestone = job.milestones.find((milestone: any) => String(milestone._id) === milestoneId);
    if (!milestone) {
        throw new NotFoundError("Milestone not found within this job!");
    }

    milestone.paymentInfo = {
        amountPaid,
        paymentMethod,
        date,
    };
    if(req.file){
      milestone.paymentInfo.paymentReciept = req.file.path;
    }
    milestone.paymentStatus = MilestonePaymentStatus.paid;

    await job.save();
    const data = await jobService.fetchJobById(String(jobId));

    successResponse(res,StatusCodes.OK, data);
});

export const jobAnalyticsController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const { filterBy = 'day', startDate, endDate } = req.query;
  const userId = req.user._id;
  const data = await jobService.jobAnalytics(filterBy, startDate, endDate, userId);

  successResponse(res,StatusCodes.OK, data);

})