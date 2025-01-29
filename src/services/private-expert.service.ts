import Expert from "../models/private-expert.moodel";

export const createPrivateExpert = async(payload :any)=>{
    return await Expert.create(payload);
};

export const fetchCountPrivateExpertsAdminDashboard = async()=>{
    return await Expert.countDocuments();
};


export const fetchAllPrivateExpertsAdminDashboard = async(page: number, limit: number)=>{
    const skip = (page - 1) * limit;
    return await Expert.find()
    .skip(skip)
    .limit(limit);
}