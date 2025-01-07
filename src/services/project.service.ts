import { ProjectStatusEnum } from "../enums/project.enum";
import { IProject } from "../interfaces/project.interface";
import Project from "../models/project.model";

export const createProject = async (data:  IProject) =>{
    return await Project.create(data);
};

export const fetchProjectById = async (projectId: string) =>{
    return await Project.findById(projectId);
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