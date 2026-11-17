import Target from "../models/target.model";
import { upsertUserTarget } from "./user-report.service";

export const createTarget = async(payload: any)=>{
    return upsertUserTarget(String(payload.userId), payload);
};

export const findUserTarget = async (userId: string, query: Record<string, unknown> = {}) =>{
    return await Target.findOne({userId: userId, ...query}).sort({ updatedAt: -1 });
};

