import { IJob } from "../interfaces/jobs.interface";
import Jobs from "../models/jobs.model";
import  JobLike  from "../models/joblike.model";

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
    specificFields: string[] = [] 
  ) => {
    const skip = (page - 1) * limit;
    const searchCriteria: any = {};
  
    if (search) {
      const searchRegex = new RegExp(search, 'i'); 
  
      if (specificFields.length === 0) {
        const jobSchemaPaths = Jobs.schema.paths;
        const stringFields = Object.keys(jobSchemaPaths).filter(
          (field) => jobSchemaPaths[field].instance === 'String'
        );
        searchCriteria.$or = stringFields.map((field) => ({ [field]: searchRegex }));
      } else {
        searchCriteria.$or = specificFields.map((field) => ({ [field]: searchRegex }));
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
}

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