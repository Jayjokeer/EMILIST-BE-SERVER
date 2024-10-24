import { IJob } from "../interfaces/jobs.interface";
import Jobs from "../models/jobs.model";

export const createJob = async (data:  IJob) =>{
    return await Jobs.create(data);
};

export const fetchAllUserJobs = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const jobs = await Jobs.find({ userId: userId }).skip(skip).limit(limit);
    const totalJobs = await Jobs.countDocuments({ userId: userId });
  
    return {
      jobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      totalJobs,
    };
  };
  
  export const fetchAllJobs = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const jobs = await Jobs.find().skip(skip).limit(limit);
    const totalJobs = await Jobs.countDocuments();
  
    return {
      jobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      totalJobs,
    };
  };

export const fetchJobById = async (jobId: string)=>{
    return await Jobs.findById(jobId);
}