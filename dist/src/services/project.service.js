"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completedJobsCount = exports.fetchAllUserProjectsAdmin = exports.updateRejectProject = exports.deleteProject = exports.fetchAllUserProjects = exports.fetchProjectById = exports.createProject = void 0;
const project_enum_1 = require("../enums/project.enum");
const project_model_1 = __importDefault(require("../models/project.model"));
const createProject = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.create(data);
});
exports.createProject = createProject;
const fetchProjectById = (projectId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.findById(projectId);
});
exports.fetchProjectById = fetchProjectById;
const fetchAllUserProjects = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.find({ user: userId });
});
exports.fetchAllUserProjects = fetchAllUserProjects;
const deleteProject = (projectId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.findOneAndDelete({ user: userId, _id: projectId });
});
exports.deleteProject = deleteProject;
const updateRejectProject = (projectId, jobId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.updateMany({ job: jobId, _id: { $ne: projectId } }, { status: project_enum_1.ProjectStatusEnum.rejected });
});
exports.updateRejectProject = updateRejectProject;
const fetchAllUserProjectsAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.find({ user: userId })
        .populate('job', '_id title description budget')
        .lean();
});
exports.fetchAllUserProjectsAdmin = fetchAllUserProjectsAdmin;
const completedJobsCount = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.countDocuments({
        businessId: businessId,
        status: project_enum_1.ProjectStatusEnum.completed,
    });
});
exports.completedJobsCount = completedJobsCount;
