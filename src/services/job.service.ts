import { IJob } from "../interfaces/jobs.interface";
import Jobs from "../models/jobs.model";
import  JobLike  from "../models/joblike.model";

export const createJob = async (data:  IJob) =>{
    return await Jobs.create(data);
};

export const fetchAllUserJobs = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const jobs = await Jobs.find({ userId: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalJobs = await Jobs.countDocuments({ userId: userId });
  
    return {
      jobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      totalJobs,
    };
  };
  
  export const fetchAllJobs = async (page: number, limit: number, userId: string | null) => {
    const skip = (page - 1) * limit;
    const jobs = await Jobs.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  
    console.log(userId)
    const totalJobs = await Jobs.countDocuments();
  
    let jobsWithLikeStatus;
    if (userId) {
      
      const likedJobs = await JobLike.find({ user: userId }).select('job').lean();
      const likedJobIds = likedJobs.map((like) => like.job.toString());
  
      
      jobsWithLikeStatus = jobs.map((job) => ({
        ...job.toObject(),
        liked: likedJobIds.includes(job._id.toString()),
      }));
      console.log(jobsWithLikeStatus)
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