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