import { IJob, IMilestone, IRecurringJob } from "../interfaces/jobs.interface";
import Jobs from "../models/jobs.model";
import  JobLike  from "../models/joblike.model";
import Project from "../models/project.model";
import { BadRequestError, NotFoundError } from "../errors/error";
import { JobStatusEnum, JobType, MilestoneEnum } from "../enums/jobs.enum";
import { ProjectStatusEnum } from "../enums/project.enum";
import { add } from 'date-fns';
import moment from "moment";
import * as userService from './auth.service';
import { PipelineStage } from 'mongoose';
import Business from "../models/business.model";
import RecurringJob from "../models/recurring-job.model";

export const createJob = async (data:  IJob) =>{
    return await Jobs.create(data);
};

export const fetchAllUserJobs = async (
  userId: string,
  page: number,
  limit: number,
  search: string | null = null,
  filters: { title?: string, location?: string, category?: string, service?: string } = {}
) => {
  const skip = (page - 1) * limit;
  
  const searchCriteria: any = { userId };

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const jobSchemaPaths = Jobs.schema.paths;
    const stringFields = Object.keys(jobSchemaPaths).filter(
      (field) => jobSchemaPaths[field].instance === 'String'
    );

    searchCriteria.$or = stringFields.map((field) => ({ [field]: { $regex: searchRegex } }));
  } else {
    if (filters.title) searchCriteria.title = { $regex: new RegExp(filters.title, 'i') };
    if (filters.location) searchCriteria.location = { $regex: new RegExp(filters.location, 'i') };
    if (filters.category) searchCriteria.category = { $regex: new RegExp(filters.category, 'i') };
    if (filters.service) searchCriteria.service = { $regex: new RegExp(filters.service, 'i') };
  }
  const jobs = await Jobs.find(searchCriteria).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const totalJobs = await Jobs.countDocuments(searchCriteria);

  return {
    jobs,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: page,
    totalJobs,
  };
};

  
export const fetchAllJobs = async (
  page: number,
  limit: number,
  userId: string | null,
  search: string | null,
  filters: { title?: string, location?: string, category?: string, service?: string } = {}
) => {
  const skip = (page - 1) * limit;
  const searchCriteria: any = {
    type: { $ne: JobType.direct },
    status: JobStatusEnum.pending,
  };

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const jobSchemaPaths = Jobs.schema.paths;
    const stringFields = Object.keys(jobSchemaPaths).filter(
      (field) => jobSchemaPaths[field].instance === 'String'
    );

    searchCriteria.$or = stringFields.map((field) => ({ [field]: { $regex: searchRegex } }));
  } else {
    if (filters.title) searchCriteria.title = { $regex: new RegExp(filters.title, 'i') };
    if (filters.location) searchCriteria.location = { $regex: new RegExp(filters.location, 'i') };
    if (filters.category) searchCriteria.category = { $regex: new RegExp(filters.category, 'i') };
    if (filters.service) searchCriteria.service = { $regex: new RegExp(filters.service, 'i') };
  }

  if (userId) {
    const user = await userService.fetchUserMutedJobs(userId)
    if (user && user.mutedJobs && user.mutedJobs.length > 0) {
      searchCriteria._id = { $nin: user.mutedJobs };
    }
  }

  const jobs = await Jobs.find(searchCriteria)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalJobs = await Jobs.countDocuments(searchCriteria);

  let jobsWithLikeStatus;
  if (userId) {
    const likedJobs = await JobLike.find({ user: userId }).select('job').lean();
    const likedJobIds = likedJobs.map((like) => like.job.toString());

    jobsWithLikeStatus = jobs.map((job) => ({
      ...job.toObject(),
      liked: likedJobIds.includes(job._id.toString()),
    }));
  } else {
    jobsWithLikeStatus = jobs.map((job) => ({
      ...job.toObject(),
      liked: false,
    }));
  }

  return {
    jobs: jobsWithLikeStatus,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: page,
    totalJobs,
  };
};

  
  
  

export const fetchJobById = async (jobId: string)=>{
  return await Jobs.findById(jobId);
  
};

export const fetchJobByIdWithUserId = async (jobId: string)=>{
  return await Jobs.findById(jobId)
  .populate({
    path: 'acceptedApplicationId',
    populate: {path: 'user', select: '_id'}
  });
  
};


export const fetchJobByIdWithDetails = async (jobId: string) => {
  const job = await Jobs.findById(jobId)
    .populate('userId', 'fullName userName email location level profileImage')
    .populate({
      path: 'applications',
      populate: { path: 'user', select: 'fullName userName email location level profileImage' },
    });   

  if (!job) throw new NotFoundError("Job not found!");

  const creatorId = job.userId;
  const totalJobsPosted = await Jobs.countDocuments({ userId: creatorId });
  const totalArtisansHired = await Project.countDocuments({
    creator: creatorId,
    status: 'accepted',
  });

  let milestones = [];
  let jobDueDate = null;

  if (job.startDate && (job.status === 'active' || job.status === 'paused')) {
    let cumulativeDays = 0;

    for (const milestone of job.milestones) {
      if (milestone.timeFrame.period === 'days') {
        cumulativeDays += parseInt(milestone.timeFrame.number, 10);
      }
    }

    jobDueDate = add(job.startDate, { days: cumulativeDays });
    milestones = job.milestones.map((milestone: any) => ({
      ...milestone.toObject(),
      dueDate: add(job.startDate!, { days: cumulativeDays }), 
    }));
  } else {
    milestones = job.milestones;
  }

  return {
    job: {
      ...job.toObject(),
      dueDate: jobDueDate,
      milestones: milestones,
    },
    totalJobsPosted,
    totalArtisansHired,
  };
};

export const ifLikedJob = async (jobId: string, userId: string)=>{
    return await JobLike.findOne({ job: jobId, user: userId });
};

export const createJobLike = async (data: any) =>{
    return await JobLike.create(data);
};


export const fetchLikedJobs = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
  
    
    const likedJobs = await JobLike.find({ user: userId }).select('job').lean();
    const likedJobIds = likedJobs.map((like) => like.job);
  

    const jobs = await Jobs.find({ _id: { $in: likedJobIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  
    const totalLikedJobs = likedJobIds.length;
  
    return {
      jobs,
      totalPages: Math.ceil(totalLikedJobs / limit),
      currentPage: page,
      totalLikedJobs,
    };
  };
  
  export const unlikeJob = async (jobId: string, userId: string ) =>{
    
   return await JobLike.findOneAndDelete({user: userId, job: jobId});
  };
  export const deleteJobApplication = async (jobId: string, projectId: string ) =>{
    
    return  await Jobs.updateOne(
      { _id: jobId }, 
      { $pull: { applications: projectId } }
    );
   };
  
   export const deleteJobById = async (jobId: string, userId: string ) =>{
    return await Jobs.findOneAndDelete({userId: userId, _id: jobId});
   };
   export const fetchJobByUserIdAndStatus = async ( userId: string, status: JobStatusEnum ) =>{
    return await Jobs.find({userId: userId, status: status});
   };
   export const fetchUserJobApplications = async (
    userId: string,
    skip: number,
    limit: number,
    status: JobStatusEnum | null,
    page: number,
    search: string | null = null,
    filters: { title?: string, location?: string, category?: string, service?: string } = {}
  ) => {
    const userProjects = await Project.find({ user: userId }).select('_id');
    const projectIds = userProjects.map((project) => project._id);
  
    let query: any = { applications: { $in: projectIds } };
    if (status) {
      query.status = status;
      if (status === JobStatusEnum.active) {
        query = { acceptedApplicationId: { $in: projectIds } };
        query.status = status;
      }
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const jobSchemaPaths = Jobs.schema.paths;
      const stringFields = Object.keys(jobSchemaPaths).filter(
        (field) => jobSchemaPaths[field].instance === 'String'
      );
  
      query.$or = stringFields.map((field) => ({ [field]: { $regex: searchRegex } }));
    } else {
      if (filters.title) query.title = { $regex: new RegExp(filters.title, 'i') };
      if (filters.location) query.location = { $regex: new RegExp(filters.location, 'i') };
      if (filters.category) query.category = { $regex: new RegExp(filters.category, 'i') };
      if (filters.service) query.service = { $regex: new RegExp(filters.service, 'i') };
    }
    const userApplications = await Jobs.find(query)
      .populate('applications', 'title description status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  
    const applicationsWithDueDates = await Promise.all(
      userApplications.map(async (job) => {
        if (job.status !== JobStatusEnum.active && job.status !== JobStatusEnum.paused) {
          return job.toObject();
        }
        let accumulatedTime = job.startDate!.getTime();
        let milestoneDueDate: any = null;
        const totalMilestones = job.milestones.length;
        let completedMilestones = 0;

        job.milestones.forEach((milestone: any) => {
          const timeMultiplier = milestone.timeFrame.period === 'days' ? 86400000 : 604800000;
          const milestoneDuration = milestone.timeFrame.number * timeMultiplier;
  
          accumulatedTime += milestoneDuration;
          
          if (milestone.status ===  MilestoneEnum.active || milestone.status ===  MilestoneEnum.completed) {
            completedMilestones += 1;
          }
          if ((milestone.status === MilestoneEnum.active || milestone.status === MilestoneEnum.paused) && !milestoneDueDate) {
            milestoneDueDate = new Date(accumulatedTime);
          }
        });
        const milestoneProgress = `${completedMilestones}/${totalMilestones}`;

        const overallDueDate = new Date(accumulatedTime);
  
        return {
          ...job.toObject(),
          milestoneDueDate,
          overallDueDate,
          milestoneProgress,
        };
      })
    );
  
    const totalApplications = await Jobs.countDocuments(query);
  
    return {
      total: totalApplications,
      page,
      limit,
      applications: applicationsWithDueDates,
    };
  };
  
  
  export const fetchUserApplications = async(userId: string, skip: number, limit: number, status: ProjectStatusEnum, page: number)=>{
  const userProjects = await Project.find({ user: userId ,     
    status: status as ProjectStatusEnum,
  }).select('_id');
    const projectIds = userProjects.map((project) => project._id);

    const userApplications = await Jobs.find({
      applications:   { $in: projectIds } ,
    })
      .populate('applications', 'title description status')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalApplications = await Jobs.countDocuments({
      applications: { $in: projectIds  },
    });

    return {
      total: totalApplications,
      page: Number(page),
      limit: Number(limit),
      applications: userApplications,
    };
  }


  export const jobAnalytics = async (year: number = moment().year(), month?: number, startDate?: string, endDate?: string, userId?: string) => {
    let start, end;
  
    if (startDate && endDate) {
      start = moment(startDate);
      end = moment(endDate);
      if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        throw new BadRequestError('Invalid date range');
      }
    } else if (year && month) {
      start = moment(`${year}-${month}-01`);
      end = start.clone().endOf('month');
    } else if (year) {
      start = moment(`${year}-01-01`);
      end = moment(`${year}-12-31`);
    } else {
      throw new BadRequestError('Year is required');
    }
  
    const dateRange = [];
    let currentDate = start.clone();
  
    const interval = month ? 'days' : 'months';
  
    while (currentDate.isSameOrBefore(end)) {
      dateRange.push(currentDate.clone());
      currentDate = currentDate.add(1, interval);
    }
  
    const analyticsData = await Promise.all(
      dateRange.map(async (date) => {
        const dayStart = date.startOf(interval).toDate();
        const dayEnd = date.endOf(interval).toDate();
  
        const jobs = await Jobs.aggregate([
          {
            $match: {
              userId,
              createdAt: { $gte: dayStart, $lt: dayEnd },
            },
          },
          {
            $facet: {
              totalJobs: [{ $count: 'count' }],
              totalActiveJobs: [
                { $match: { status: JobStatusEnum.active } },
                { $count: 'count' },
              ],
              totalOverdueJobs: [
                {
                  $match: {
                    status: { $ne: JobStatusEnum.complete },
                    'milestones.timeFrame': { $lt: new Date() },
                  },
                },
                { $count: 'count' },
              ],
              totalPausedJobs: [
                { $match: { status: JobStatusEnum.paused } },
                { $count: 'count' },
              ],
              totalCompletedJobs: [
                { $match: { status: JobStatusEnum.complete } },
                { $count: 'count' },
              ],
            },
          },
          {
            $project: {
              totalJobs: { $arrayElemAt: ['$totalJobs.count', 0] },
              totalActiveJobs: { $arrayElemAt: ['$totalActiveJobs.count', 0] },
              totalOverdueJobs: { $arrayElemAt: ['$totalOverdueJobs.count', 0] },
              totalPausedJobs: { $arrayElemAt: ['$totalPausedJobs.count', 0] },
              totalCompletedJobs: { $arrayElemAt: ['$totalCompletedJobs.count', 0] },
            },
          },
        ]);
  
        return {
          period: date.format(interval === 'months' ? 'MMM YYYY' : 'MMM D, YYYY'),
          totalJobs: jobs[0]?.totalJobs || 0,
          totalActiveJobs: jobs[0]?.totalActiveJobs || 0,
          totalOverdueJobs: jobs[0]?.totalOverdueJobs || 0,
          totalPausedJobs: jobs[0]?.totalPausedJobs || 0,
          totalCompletedJobs: jobs[0]?.totalCompletedJobs || 0,
        };
      })
    );
  
    return analyticsData;
  };
  
export const fetchJobCount = async( userId: string)=>{
  const totalPendingJobs = await Jobs.countDocuments({ userId, status: JobStatusEnum.pending });
  const totalActiveJobs = await Jobs.countDocuments({ userId, status: JobStatusEnum.active });
  const totalPausedJobs = await Jobs.countDocuments({ userId, status: JobStatusEnum.paused });
  const totalCompletedJobs = await Jobs.countDocuments({ userId, status: JobStatusEnum.complete });

  const totalOverdueJobs = await Jobs.countDocuments({
    userId,
    status: JobStatusEnum.active,
    dueDate: { $lt: new Date() },
  });


   return {
      totalPendingJobs,
      totalActiveJobs,
      totalOverdueJobs,
      totalPausedJobs,
      totalCompletedJobs,
    }


};
export const fetchProjectCounts = async(userId: string)=>{
  const userProjects = await Project.find({ user: userId });

  let totalPendingProjects = 0;
  let totalOverdueProjects = 0;
  let totalDueProjects = 0;

  const currentDate = new Date();
  const userProjectIds = userProjects.map((project) => project._id);


  const totalActiveProjects = await Jobs.countDocuments({
    acceptedApplicationId: { $in: userProjectIds },
    status: JobStatusEnum.active,
  });
  const totalPausedProjects = await Jobs.countDocuments({
    acceptedApplicationId: { $in: userProjectIds },
    status: JobStatusEnum.paused,
  });
  const totalCompletedProjects = await Jobs.countDocuments({
    acceptedApplicationId: { $in: userProjectIds },
    status: JobStatusEnum.complete,
  });
  userProjects.forEach((project) => {

   if (project.status == ProjectStatusEnum.pending) {
        totalPendingProjects++;
    }
  });
  const jobs = await Jobs.find({
    acceptedApplicationId: { $in: userProjectIds },
    status: JobStatusEnum.active,
  });


  jobs.forEach((job) => {
    let isProjectDue = false; 

    job.milestones.forEach((milestone: any) => {
      if (milestone.status === MilestoneEnum.overdue) {
        totalOverdueProjects++;
      } else if (milestone.status === MilestoneEnum.active || milestone.status === MilestoneEnum.pending) {
        const milestoneDueDate = new Date(
          (job.startDate?.getTime() ?? currentDate.getTime()) +
          (milestone.timeFrame.number ?? 0) * 24 * 60 * 60 * 1000 // assuming timeFrame is in days
        );

        if (milestoneDueDate <= currentDate) {
          isProjectDue = true;
        }
      }
    });

    if (isProjectDue) {
      totalDueProjects++;
    }
  });
  return {
    totalPendingProjects,
    totalActiveProjects,
    totalPausedProjects,
    totalCompletedProjects,
    totalOverdueProjects,
  };
}
export const projectAnalytics = async (year: number = moment().year(), month?: number, startDate?: string, endDate?: string, userId?: string) => {
  let start, end;

  if (startDate && endDate) {
    start = moment(startDate, 'YYYY-MM-DD', true);
    end = moment(endDate, 'YYYY-MM-DD', true);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      throw new BadRequestError('Invalid date range');
    }
  } else if (year && month) {
    start = moment(`${year}-${String(month).padStart(2, '0')}-01`, 'YYYY-MM-DD', true);
    end = start.clone().endOf('month');
  } else if (year) {
    start = moment(`${year}-01-01`, 'YYYY-MM-DD', true);
    end = moment(`${year}-12-31`, 'YYYY-MM-DD', true);
  }

  const dateRange = [];
  let currentDate = start!.clone();
  const interval = month ? 'days' : 'months';

  while (currentDate.isSameOrBefore(end)) {
    dateRange.push(currentDate.clone());
    currentDate = currentDate.add(1, interval);
  }

  const projects = await Project.find({ user: userId }).select('_id');
  const projectIds = projects.map(project => project._id);
  const analyticsData = await Promise.all(
    dateRange.map(async (date) => {
      const dayStart = date.startOf(interval).toDate();
      const dayEnd = date.endOf(interval).toDate();

      const jobs = await Jobs.aggregate([
        {
          $match: {
            acceptedApplicationId: { $in: projectIds },
            createdAt: { $gte: dayStart, $lt: dayEnd },
          },
        },
        {
          $facet: {
            totalProjects: [{ $count: 'count' }],
            totalActiveProjects: [
              { $match: { status: JobStatusEnum.active } },
              { $count: 'count' },
            ],
            totalOverdueProjects: [
              {
                $match: {
                  status: { $ne: JobStatusEnum.complete },
                  'milestones.timeFrame': { $lt: new Date() },
                },
              },
              { $count: 'count' },
            ],
            totalPausedProjects: [
              { $match: { status: JobStatusEnum.paused } },
              { $count: 'count' },
            ],
            totalCompletedProjects: [
              { $match: { status: JobStatusEnum.complete } },
              { $count: 'count' },
            ],
          },
        },
        {
          $project: {
            totalProjects: { $arrayElemAt: ['$totalProjects.count', 0] },
            totalActiveProjects: { $arrayElemAt: ['$totalActiveProjects.count', 0] },
            totalOverdueProjects: { $arrayElemAt: ['$totalOverdueProjects.count', 0] },
            totalPausedProjects: { $arrayElemAt: ['$totalPausedProjects.count', 0] },
            totalCompletedProjects: { $arrayElemAt: ['$totalCompletedProjects.count',0] },
          },
        },
      ] 
    );
      return {
        period: date.format(interval === 'months' ? 'MMM YYYY' : 'MMM D, YYYY'),
        totalProjects: jobs[0]?.totalProjects || 0,
        totalActiveProjects: jobs[0]?.totalActiveProjects || 0,
        totalOverdueProjects: jobs[0]?.totalOverdueProjects || 0,
        totalPausedProjects: jobs[0]?.totalPausedProjects || 0,
        totalCompletedProjects: jobs[0]?.totalCompletedProjects|| 0,
      };
    })
  );

  return analyticsData;
};

export const fetchAllJobsForAdminDashboard = async () => {
  return await Jobs.countDocuments();
};

export const fetchAllUserJobsAdmin = async (userId: string) => {
  return await Jobs.find({ userId })
  .sort({ createdAt: -1 })
  .populate('applications', 'title description status')
  .lean();
};


export const fetchAllJobsAdmin = async (status: string, page: number, limit: number, search: any) => {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  let matchQuery: any = {};

  if (status === 'notStarted') {
    matchQuery.status = JobStatusEnum.pending;
  } else if (status === 'inProgress') {
    matchQuery.status = JobStatusEnum.active;
  } else if (status === 'completed') {
    matchQuery.status = JobStatusEnum.complete;
  }

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: 'Users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    } as PipelineStage,
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    } as PipelineStage,
    {
      $match: {
        ...matchQuery,
        ...(search ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { jobId: { $regex: search, $options: 'i' } },
            { 'user.userName': { $regex: search, $options: 'i' } },
            { 'user.fullName': { $regex: search, $options: 'i' } }
          ]
        } : {})
      }
    } as PipelineStage
  ];

  const jobsPipeline: PipelineStage[] = [
    ...pipeline,
    { $sort: { createdAt: -1 } } as PipelineStage,
    { $skip: Number(skip) } as PipelineStage,
    { $limit: Number(limitNum) } as PipelineStage
  ];

  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: 'total' } as PipelineStage
  ];

  const [jobs, countResult] = await Promise.all([
    Jobs.aggregate(jobsPipeline),
    Jobs.aggregate(countPipeline)
  ]);

  const totalJobs = countResult[0]?.total || 0;

  return {
    totalJobs,
    jobs,
    page: pageNum,
    totalPages: Math.ceil(totalJobs / limitNum)
  };
};
export const fetchAllLikedJobs = async (userId: string) => {

  
  const likedJobs = await JobLike.countDocuments({ user: userId });

  return {
    totalLikedJobs: likedJobs,
  };
};

export const fetchJobLeads = async (userId: string, page: number, limit: number)=>{
  const skip = (page - 1) * limit;

  const businesses = await Business.find({ userId: userId }).exec();

    let offeredServices: string[] = [];
  businesses.forEach(business => {
    if (business.services && business.services.length) {
      offeredServices = offeredServices.concat(business.services);
    }
  });
  offeredServices = Array.from(new Set(offeredServices));

  const filter = {
    service: { $in: offeredServices },
    isClosed: false,
    userId: { $ne: userId }
  };

  const [jobs, total] = await Promise.all([
    Jobs.find(filter).skip(skip).limit(limit).exec(),
    Jobs.countDocuments(filter)
  ]);

  return {
    leadJobs: jobs,
    page,
    totalPages: Math.ceil(total / limit),
    totalLeads: total,
  };
}

export const updateMilestone = async (
  jobId: string,
  milestoneId: string,
  updateData: any
) => {
 return await Jobs.updateOne(
    { _id: jobId, 'milestones._id': milestoneId },
    {
      $set: {
        'milestones.$.paymentStatus': updateData.paymentStatus,
        'milestones.$.paymentInfo': updateData.paymentInfo,
      },
    }
  );
};

export const createRecurringJob = async (payload: IRecurringJob)=>{
  return await RecurringJob.create(payload);
};