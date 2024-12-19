import Target from "../models/target.model";

export const createTarget = async(payload: any)=>{
    return await Target.create(payload);
};

export const findUserTarget = async (userId: string) =>{
    return await Target.findOne({userId: userId});
}