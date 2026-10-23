import { ProjectStatusEnum } from "../enums/project.enum";
import { IProject } from "../interfaces/project.interface";
import Project from "../models/project.model";

export const createProject = async (data:  IProject) =>{
    return await Project.create(data);
};

export const fetchProjectById = async (projectId: string) =>{
    return await Project.findById(projectId);
};

export const fetchApplicationByIdWithDetails = async (applicationId: string) => {
  return Project.findById(applicationId)
    .populate('user', 'firstName lastName userName displayImage level uniqueId')
    .populate('creator', 'firstName lastName userName displayImage uniqueId')
    .populate('businessId', 'businessName services renderedServices yearFounded businessAddress businessCity businessState businessCountry')
    .populate({
      path: 'job',
      select: 'title description type status jobCategory service currency maximumPrice milestones location userId acceptedApplicationId',
    })
    .populate('counterOffers.madeBy', 'firstName lastName userName displayImage uniqueId')
    .lean();
};

export const fetchApplicationByJobAndUser = async (jobId: string, userId: string) => {
  return await Project.findOne({
    job: jobId,
    user: userId,
  });
};

export const fetchAllUserProjects = async (userId: string) =>{
    return await Project.find({user: userId});
};

export const deleteProject = async (projectId: string, userId: string ) =>{

    return await Project.findOneAndDelete({user: userId, _id: projectId});

    
};
export const updateRejectProject = async (projectId: string, jobId: string ) =>{

    return await Project.updateMany(
        { job: jobId, _id: { $ne: projectId } }, 
        { status: ProjectStatusEnum.rejected }        
      );
    
};

export const fetchAllUserProjectsAdmin = async (userId: string) =>{
    return await Project.find({user: userId})
    .populate('job', '_id title description budget')
    .lean();
};
export const completedJobsCount = async (businessId: string) =>{
       return await Project.countDocuments({
    businessId: businessId,
    status: ProjectStatusEnum.completed,
  })};
