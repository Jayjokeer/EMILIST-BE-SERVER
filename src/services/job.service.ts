import { IJob, IMilestone } from "../interfaces/jobs.interface";
import Jobs from "../models/jobs.model";
import  JobLike  from "../models/joblike.model";
import Project from "../models/project.model";
import { BadRequestError, NotFoundError } from "../errors/error";
import { JobStatusEnum, JobType } from "../enums/jobs.enum";
import { ProjectStatusEnum } from "../enums/project.enum";
import { add } from 'date-fns';
import moment from "moment";


export const createJob = async (data:  IJob) =>{
    return await Jobs.create(data);
};

export const fetchAllUserJobs = async (
  userId: string,
  page: number,
  limit: number,
  search: string | null = null,
  fields: string[] = []
) => {
  const skip = (page - 1) * limit;
  
  const filter: any = { userId };

  if (search) {
    const searchConditions = fields.length > 0 
      ? fields.map(field => ({ [field]: { $regex: search, $options: 'i' } }))  // Search within specific fields
      : [{ $text: { $search: search } }]; 
    
    filter.$or = searchConditions;
  }

  const jobs = await Jobs.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const totalJobs = await Jobs.countDocuments(filter);

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
    fields: string[] = [] 
  ) => {
    const skip = (page - 1) * limit;
    const searchCriteria: any = { type: { $ne: JobType.direct } }; 
  
    if (search) {
      const searchRegex = new RegExp(search, 'i'); 
  
      if (fields.length === 0) {
        const jobSchemaPaths = Jobs.schema.paths;
        const stringFields = Object.keys(jobSchemaPaths).filter(
          (field) => jobSchemaPaths[field].instance === 'String'
        );
        searchCriteria.$or = stringFields.map((field) => ({ [field]: searchRegex }));
      } else {
        searchCriteria.$or = fields.map((field) => ({ [field]: searchRegex }));
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
  return await Jobs.findById(jobId)
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

  let jobDueDate = null;
  const milestonesWithDueDates = [];
  let previousEndDate = job.startDate;

  if (job.status === JobStatusEnum.active && job.startDate) {
    for (const milestone of job.milestones) {
      if (!previousEndDate) break;

      const milestoneDueDate = add(previousEndDate, {
        [milestone.timeFrame.period]: milestone.timeFrame.number,
      });

      milestonesWithDueDates.push({
        ...milestone.toObject(),
        dueDate: milestoneDueDate,
      });

      previousEndDate = milestoneDueDate;
    }

    jobDueDate = previousEndDate;
  }

  return {
    job: {
      ...job.toObject(),
      dueDate: jobDueDate,
      milestones: milestonesWithDueDates,
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
   export const fetchUserJobApplications = async(userId: string, skip: number, limit: number, status: JobStatusEnum | null, page: number )=>{
    const userProjects = await Project.find({ user: userId }).select('_id');
    const projectIds = userProjects.map((project) => project._id);
 
    let query: any = { applications: { $in: projectIds } };
    if (status) {
      query.status = status;
      if(status == JobStatusEnum.active){
        query = { acceptedApplicationId: { $in: projectIds } }
        query.status = status;
      }
    }
    const userApplications = await Jobs.find(query)
    .populate('applications', 'title description status')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalApplications = await Jobs.countDocuments(query);

  return {
    total: totalApplications,
    page,
    limit,
    applications: userApplications
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
export const jobAnalytics = async(filterBy: any, startDate: string,endDate: string, userId: string) =>{
  const start = moment(startDate);
  const end = moment(endDate);

  if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
   throw new BadRequestError('Invalid date range' );
  }

  const dateRange = [];
  let currentDate = start.clone();

  while (currentDate.isSameOrBefore(end)) {
    dateRange.push(currentDate.clone());
    currentDate = currentDate.add(1, filterBy);
  }

  const analyticsData = await Promise.all(
    dateRange.map(async (date) => {
      const dayStart = date.startOf(filterBy).toDate();
      const dayEnd = date.endOf(filterBy).toDate();

      const jobs = await Jobs.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: dayStart, $lt: dayEnd }
          }
        },
        {
          $facet: {
            totalJobs: [{ $count: 'count' }],
            totalActiveJobs: [
              { $match: { status: JobStatusEnum.active } },
              { $count: 'count' }
            ],
            totalOverdueJobs: [
              {
                $match: {
                  status: { $ne: JobStatusEnum.complete },
                  'milestones.timeFrame': {
                    $lt: new Date()
                  }
                }
              },
              { $count: 'count' }
            ],
            totalPausedJobs: [
              { $match: { status: JobStatusEnum.paused } },
              { $count: 'count' }
            ],
            totalCompletedJobs: [
              { $match: { status: JobStatusEnum.complete } },
              { $count: 'count' }
            ]
          }
        },
        {
          $project: {
            totalJobs: { $arrayElemAt: ['$totalJobs.count', 0] },
            totalActiveJobs: { $arrayElemAt: ['$totalActiveJobs.count', 0] },
            totalOverdueJobs: { $arrayElemAt: ['$totalOverdueJobs.count', 0] },
            totalPausedJobs: { $arrayElemAt: ['$totalPausedJobs.count', 0] },
            totalCompletedJobs: { $arrayElemAt: ['$totalCompletedJobs.count', 0] }
          }
        }
      ]);
      return {
        day: date.format(filterBy === 'year' ? 'YYYY' : filterBy === 'month' ? 'MMM YYYY' : 'MMM D'),
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

  //  export const findJobsForCron = async () =>{
  //   return await Jobs.findOneAndDelete({userId: userId, _id: jobId});
  //  };