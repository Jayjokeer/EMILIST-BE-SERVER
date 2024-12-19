import Expert from "../models/private-expert.moodel";

export const createPrivateExpert = async(payload :any)=>{
    return await Expert.create(payload);
};