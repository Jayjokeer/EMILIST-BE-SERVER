import IBusiness from "../interfaces/business.interface";
import Business from "../models/business.model";

export const createBusiness = async (data:  IBusiness) =>{
    return await Business.create(data);
};