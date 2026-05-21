"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completedJobsCount = exports.fetchAllUserProjectsAdmin = exports.updateRejectProject = exports.deleteProject = exports.fetchAllUserProjects = exports.fetchProjectById = exports.createProject = void 0;
const project_enum_1 = require("../enums/project.enum");
const project_model_1 = __importDefault(require("../models/project.model"));
const createProject = async (data) => {
    return await project_model_1.default.create(data);
};
exports.createProject = createProject;
const fetchProjectById = async (projectId) => {
    return await project_model_1.default.findById(projectId);
};
exports.fetchProjectById = fetchProjectById;
const fetchAllUserProjects = async (userId) => {
    return await project_model_1.default.find({ user: userId });
};
exports.fetchAllUserProjects = fetchAllUserProjects;
const deleteProject = async (projectId, userId) => {
    return await project_model_1.default.findOneAndDelete({ user: userId, _id: projectId });
};
exports.deleteProject = deleteProject;
const updateRejectProject = async (projectId, jobId) => {
    return await project_model_1.default.updateMany({ job: jobId, _id: { $ne: projectId } }, { status: project_enum_1.ProjectStatusEnum.rejected });
};
exports.updateRejectProject = updateRejectProject;
const fetchAllUserProjectsAdmin = async (userId) => {
    return await project_model_1.default.find({ user: userId })
        .populate('job', '_id title description budget')
        .lean();
};
exports.fetchAllUserProjectsAdmin = fetchAllUserProjectsAdmin;
const completedJobsCount = async (businessId) => {
    return await project_model_1.default.countDocuments({
        businessId: businessId,
        status: project_enum_1.ProjectStatusEnum.completed,
    });
};
exports.completedJobsCount = completedJobsCount;
