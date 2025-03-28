import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { IJob, IMilestone, IRecurringJob, IUpdateJob } from "../interfaces/jobs.interface";
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import { IProject } from "../interfaces/project.interface";
import * as projectService from "../services/project.service";
import { ProjectStatusEnum } from "../enums/project.enum";
import { JobStatusEnum, JobType, MilestoneEnum, MilestonePaymentStatus, QuoteStatusEnum } from "../enums/jobs.enum";
import * as authService from "../services/auth.service";
import { sendEmail } from "../utils/send_email";
import { acceptDirectJobApplicationMessage, acceptJobApplicationMessage, directJobApplicationMessage, postQuoteMessage, requestForQuoteMessage, sendJobApplicationMessage } from "../utils/templates";
import mongoose from "mongoose";
import * as  businessService from "../services/business.service";
import * as notificationService from "../services/notification.service";
import { NotificationTypeEnum } from "../enums/notification.enum";
import * as userService from "../services/auth.service";
import * as reviewService from "../services/review.service";
import * as subscriptionService from "../services/subscription.service";
import * as planService from "../services/plan.service";
import { PlanEnum } from "../enums/plan.enum";
import { calculateNextMaintenanceDate } from "../utils/utility";

export const createJobController = catchAsync( async (req: JwtPayload, res: Response) => {
    const job: IJob = req.body;
    const {artisan} = req.body;
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const fileObjects = files.map((file) => ({
        id: new mongoose.Types.ObjectId(),
        url: file.path, 
      }));
      job.jobFiles = fileObjects;
    }

  if(job.type == JobType.direct && artisan){

    const user = await authService.findUserByEmailOrUserNameDirectJob(artisan);
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
       await sendEmail(user.email, subject, html); 
      return successResponse(res,StatusCodes.CREATED, data);

  } else {
    const user = req.user._id;
    job.userId = user;
    const data = await jobService.createJob(job);

    successResponse(res,StatusCodes.CREATED, data);
}
});

export const allUserJobController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { page = 1, limit = 10, search = null, title, location, category, service } = req.query;
  const filters = {
    title, 
    location, 
    category, 
    service
  };  
  const data = await jobService.fetchAllUserJobs(
    req.user.id,
    Number(page),
    Number(limit),
    search as string,
    filters,
  );

  successResponse(res, StatusCodes.OK, data);
});

export const allJobsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { page = 1, limit = 10, title, location, category, service } = req.query; 
    
    const userId = req.query.userId ? req.query.userId : null; 
    const search = req.query.search as string || null;
    const filters = {
      title, 
      location, 
      category, 
      service
    };    
    const data = await jobService.fetchAllJobs(Number(page), Number(limit), userId, search, filters );
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
    const { jobId, type, maximumPrice, milestones , businessId} = req.body;
  
   
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
    const business = await businessService.fetchSingleBusiness(String(businessId));
    if(!business){
      throw new NotFoundError("Business not found!");
    }
    const payload: any = {
      job: jobId,
      user: userId,
      creator: job.userId,
      businessId: businessId,
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
  
    const notificationPayload = {
      userId: job.userId,
      title: "Job Application",
      message: `${req.user.userName} applied to your job titled: ${job.title}`,
      type: NotificationTypeEnum.info
    }
    const user = await userService.findUserById(job.userId);
    const {html, subject} = sendJobApplicationMessage(user!.userName, req.user.userName, job.title);
    sendEmail(user!.email, subject,html); 
    await notificationService.createNotification(notificationPayload);
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
    const user = await userService.findUserById(project!.user);

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

      const applicationStatus = "accepted";

    const notificationPayload = {
      userId: project.user,
      title: `Job application ${applicationStatus }`,
      message: `${req.user.userName} ${applicationStatus } your job application titled: ${job.title}`,
      type: NotificationTypeEnum.info
    }
    const {html, subject} = acceptJobApplicationMessage(user!.userName, req.user.userName, job.title, applicationStatus);
    await sendEmail(user!.email, subject,html); 
    await notificationService.createNotification(notificationPayload);

    }else if(status == ProjectStatusEnum.rejected){
      project.rejectedAt = new Date();
      project.status = status;

      const applicationStatus = "rejected";

    const notificationPayload = {
      userId: project.user,
      title: `Job application ${applicationStatus }`,
      message: `${req.user.userName} ${applicationStatus } your job application titled: ${job.title}`,
      type: NotificationTypeEnum.info
    }
    const {html, subject} = acceptJobApplicationMessage(user!.userName, req.user.userName, job.title, applicationStatus);
    await sendEmail(user!.email, subject,html); 
    await notificationService.createNotification(notificationPayload);

    }else if(status == ProjectStatusEnum.pause){
      job.status = JobStatusEnum.paused;
      job.pausedDate= new Date();

      job.milestones.forEach((milestone: IMilestone) => {
        if (milestone.status !== MilestoneEnum.completed && milestone.status !== MilestoneEnum.pending) {
          milestone.status = MilestoneEnum.paused;
        }
      });
      const applicationStatus = "paused";

      const notificationPayload = {
        userId: project.user,
        title: `Job ${applicationStatus }`,
        message: `${req.user.userName} ${applicationStatus } your job application titled: ${job.title}`,
        type: NotificationTypeEnum.info
      }
      const {html, subject} = acceptJobApplicationMessage(user!.userName, req.user.userName, job.title, applicationStatus);
      await sendEmail(user!.email, subject,html); 
      await notificationService.createNotification(notificationPayload);

    } else if (status == ProjectStatusEnum.unpause){
      job.status = JobStatusEnum.active;
      job.milestones.forEach((milestone: IMilestone) => {
        if (milestone.status === MilestoneEnum.paused) {
          milestone.status = MilestoneEnum.active; 
        }
      });
      const applicationStatus = "unpaused";

      const notificationPayload = {
        userId: project.user,
        title: `Job application ${applicationStatus }`,
        message: `${req.user.userName} ${applicationStatus } your job application titled: ${job.title}`,
        type: NotificationTypeEnum.info
      }
      const {html, subject} = acceptJobApplicationMessage(user!.userName, req.user.userName, job.title, applicationStatus);
      await sendEmail(user!.email, subject,html); 
      await notificationService.createNotification(notificationPayload);
    }

    await project.save();
    await job.save()
    const data = await jobService.fetchJobById(String(job._id));
    successResponse(res, StatusCodes.OK, data);
  });

  export const fetchJobByStatusController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user.id; 
    const { status } = req.query;
    let data: any;
  
    if (status === JobStatusEnum.pending || status === JobStatusEnum.complete) {
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
          currentMilestoneDueDate,
          overallDueDate, 
        };
      });
    }
  
    return  successResponse(res, StatusCodes.OK, data);
  });
  
  export const deleteFileController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {jobId, fileId} = req.params;
    const job = await jobService.fetchJobById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    job.jobFiles = job.jobFiles.filter((file: any) => file.id.toString() !== fileId);

    await job.save();

    return successResponse(res, StatusCodes.OK, "Image deleted successfully");
  });

  export const acceptDirectJobController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {projectId} = req.params;
    const {status, businessId} = req.body;
    const user = req.user;
    const project = await projectService.fetchProjectById(projectId);
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
      project.businessId= businessId; 
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
    const jobOwner = await userService.findUserById(job.userId);

    const applicationStatus = status;

    const notificationPayload = {
      userId: job.userId,
      title: `Direct job ${applicationStatus }`,
      message: `${req.user.userName} ${applicationStatus } your direct job  with ID: ${job._id}`,
      type: NotificationTypeEnum.info
    }

    const {html, subject} = acceptDirectJobApplicationMessage(user!.userName, jobOwner!.userName, String(job._id));
    await sendEmail(jobOwner!.email, subject,html); 
    await notificationService.createNotification(notificationPayload);
    return  successResponse(res, StatusCodes.OK, "Status changed successfully");
  });
  export const fetchUserAppliedJobsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const user = req.user;
    const{status, search = null, title, location, category, service} = req.query;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;
    const statusEnum = status ? (status as JobStatusEnum) : null;
    const filters = {
      title, 
      location, 
      category, 
      service
    }; 
   const data = await jobService.fetchUserJobApplications(user.id, skip, limit,statusEnum, page, search, filters)
   return  successResponse(res, StatusCodes.OK, data);
  });
  export const fetchApplicationByStatusController  = catchAsync(async (req: JwtPayload, res: Response) => {
    const user = req.user;
    const{status} = req.query;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

   const data = await jobService.fetchUserApplications(user.id, skip, limit,status, page)
   return  successResponse(res, StatusCodes.OK, data);
  });
  export const updateMilestoneStatusController = catchAsync(async (req: JwtPayload, res: Response) => {
    const user = req.user;
    const {milestoneId, jobId} = req.params;
    const {status, note, additionalAmount} = req.body;
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

      const allMilestonesCompleted = job.milestones.every(
        (m: any) => m.status === MilestoneEnum.completed
      );
  
      if (allMilestonesCompleted) {
        job.status = JobStatusEnum.complete;
        project.status = ProjectStatusEnum.completed;
        await project.save();
      }
      if(note){
        milestone.invoice.note = note;
      }
      if(additionalAmount){
      milestone.invoice.additionalAmount = additionalAmount;
      }
      milestone.invoice.invoiceRaised = true;
    }
    
    if(!milestone) throw new NotFoundError("Milestone not found");
    milestone.status = status as  MilestoneEnum;
    await job.save();
    const data = await jobService.fetchJobById(String(jobId));

    return  successResponse(res, StatusCodes.OK, data);
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

    return  successResponse(res, StatusCodes.OK, 'Request for quote sent successfully');
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

    return  successResponse(res, StatusCodes.OK, 'Quote sent successfully');
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
    return successResponse(res, StatusCodes.OK, data);
  });
  export const updateMilestonePaymentController = catchAsync( async (req:JwtPayload, res: Response) => {
    const {amountPaid, paymentMethod, date, jobId,milestoneId, note } = req.body;

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
        note,
    };
    if(req.file){
      milestone.paymentInfo.paymentReciept = req.file.path;
    }
    milestone.paymentStatus = MilestonePaymentStatus.paid;

    await job.save();
    const data = await jobService.fetchJobById(String(jobId));

    return   successResponse(res,StatusCodes.OK, data);
});

export const jobAnalyticsController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const { startDate, endDate, year, month } = req.query;
  const userId = req.user._id;
  const data = await jobService.jobAnalytics( year, month ,startDate, endDate, userId);

  return successResponse(res,StatusCodes.OK, data);

})

export const closeContractController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const userId = req.user._id;
  const {jobId} = req.params;
  const {rating, note, rateCommunication, isRecommendVendor} = req.body;

  const job = await jobService.fetchJobById(String(jobId));
  if (!job) throw new NotFoundError('Job not found!');
  if(String(userId) !== String(job.userId)){
    throw new UnauthorizedError("Unauthorized!");
  }
  if (job.isClosed) throw new BadRequestError('Contract is already closed!');

  const allMilestonesCompletedAndPaid = job.milestones.every(
    (milestone: any) => milestone.status === MilestoneEnum.completed && milestone.paymentStatus === MilestonePaymentStatus.paid
  );

  if (!allMilestonesCompletedAndPaid) {
    throw new BadRequestError('All milestones must be completed and paid before closing the contract.');
  }
  if(job.status !== JobStatusEnum.complete){
    job.status = JobStatusEnum.complete;
  }
  const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
  if(!project){
    throw new NotFoundError("Project not found!");
  }
  const business = await businessService.fetchSingleBusiness(String(project.businessId));
  if(!business) {
    throw new NotFoundError("Business not found!");
  };
  project.status = ProjectStatusEnum.completed;
  job.isClosed = true;

  const payload ={
    businessId: project.businessId,
    userId, 
    rating, 
    comment: note,
    rateCommunication,
    isRecommendVendor
};
const data = await reviewService.addReview(payload);
  await job.save();
  await project.save();
  await business.reviews?.push(data._id);
  await business.save();
  return successResponse(res,StatusCodes.OK, "Job closed successfully");

});

export const fetchJobCountsController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const userId = req.user._id;
  const data = await jobService.fetchJobCount( String(userId));

  return  successResponse(res,StatusCodes.OK, data);
});
export const fetchProjectCountsController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const userId = req.user._id;
  const data = await jobService.fetchProjectCounts( String(userId));

  return successResponse(res,StatusCodes.OK, data);
});
export const projectAnalyticsController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const { startDate, endDate, year, month } = req.query;
  const userId = req.user._id;
  const data = await jobService.projectAnalytics( year, month ,startDate, endDate, userId);

  return successResponse(res,StatusCodes.OK, data);

});
export const muteJobController = catchAsync( async(req:JwtPayload, res: Response) =>{
  const { jobId } = req.params;
  const userId = req.user._id;

  const job = await jobService.fetchJobById(jobId);
  if(!job) {
    throw new NotFoundError("Job not found!");
  }
if(String(userId) === String(job.userId)){
  throw new BadRequestError("You cannot mute your own job!");
}
const user = await userService.findUserById(userId);
const isMuted = user?.mutedJobs.includes(jobId);

if (isMuted) {
  return successResponse(res, StatusCodes.OK, "Job is already muted.");
}

  user!.mutedJobs.push(jobId)
  await user?.save()
  return successResponse(res,StatusCodes.OK, "Job muted successfully");

});

export const jobLeadsController = catchAsync( async(req:JwtPayload, res: Response)=>{
  const {page, limit} = req.query;
  const userId = req.user._id;
   const subscription = await subscriptionService.getActiveSubscription(userId);
    
      if (!subscription) {
          throw new BadRequestError("You do not have an active subscription.");
      }
      const plan = subscription.planId.name; 
    if(plan === PlanEnum.basic){
       throw new BadRequestError("Basic subscription does not include the ability to fetch leads.");
    }      

const data = await jobService.fetchJobLeads(userId,page , limit );
return successResponse(res,StatusCodes.OK, data);


});

export const createRecurringJobController = catchAsync( async (req: JwtPayload, res: Response) => {
  const { jobId, frequency, startDate, endDate, reminderDates} = req.body;

  let jobDetails;
  let appliedUser;     

  if (jobId) {
    jobDetails = await jobService.fetchJobByIdWithUserId(jobId);
    if (!jobDetails) {
      throw new NotFoundError("Job not found");
    }
    appliedUser = jobDetails.acceptedApplicationId!._id;
 
  } else {
    jobDetails = req.body;
    appliedUser = req.body.artisan;
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const fileObjects = files.map((file) => ({
        id: new mongoose.Types.ObjectId(),
        url: file.path, 
      }));
      jobDetails.jobFiles = fileObjects;
    }
  }

  const user = await authService.findUserByEmailOrUserNameDirectJob(appliedUser);
  if(!user) throw new NotFoundError("User not found!");
  
    const userId = req.user.id;
    jobDetails.userId = userId;

    const data = await jobService.createJob(jobDetails);

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
     await sendEmail(user.email, subject, html); 

  const nextMaintenanceDate = calculateNextMaintenanceDate(new Date(startDate), frequency);

  const recurringPayload: IRecurringJob = {
    jobId: data._id,
    frequency,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    nextMaintenanceDate,
    childJobs: [],
    reminderDates, 
  };

  const recurringJob = await jobService.createRecurringJob(recurringPayload);


  return successResponse(res,StatusCodes.CREATED, recurringJob);

});
