import { IJob } from "../interfaces/jobs.interface";
import Jobs from "../models/jobs.model";

export const createJob = async (data:  IJob) =>{
    return await Jobs.create(data);
};
