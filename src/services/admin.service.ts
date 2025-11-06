import Admin from "../models/admin.model";

export const createAdmin = async(payload: any)=>{
   return await Admin.create(payload);
}

export const getAdminByEmail = async(email:string)=>{
    return await Admin.findOne({email: email});
}

export const getAdminById = async(id: string)=>{
    return await Admin.findById({_id: id})
}