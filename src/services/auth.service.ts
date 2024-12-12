import { ICreateUser } from "../interfaces/user.interface";
import Users from "../models/users.model"
export const findUserByEmail = async (email: string) => {
    return await Users.findOne({email: email});
  };
export const findUserById = async (id: string)=>{
    return await Users.findById(id,{password: 0}).populate({
      path: 'businesses',
      select: 'businessId businessName', 
    }).populate('wallets');
};
export const createUser = async (data:  ICreateUser) =>{
    return await Users.create(data);
};

export const findTokenService = async (
    registrationOtp: string
  )=> {
    const tokenData = await Users.findOne({registrationOtp: registrationOtp});
  
    if (!tokenData) return null;
    
    if (tokenData.otpExpiresAt && tokenData.otpExpiresAt.getTime() < Date.now()) {
        return null; 
      }  
    return tokenData;
  };

  export const updateUserById = async (id: string, data: any) => {
    return await Users.findByIdAndUpdate(id, { $set: { ...data } }, { new: true });
  };
  
  export const findUserByUserName = async (userName: string) =>{
    return await Users.findOne({userName: userName});
  };
  export const findUserByIdWithPassword = async (id: string)=>{
    return await Users.findById(id);
};
export const findUserByUniqueId = async (id: string)=>{
  return await Users.findOne({uniqueId: id});
};
export const findUserByEmailOrUserName = async(email: string | undefined, userName: string | undefined)=>{

  return await Users.findOne({ $or: [{ email }, { userName }] });
}   
export const findSpecificUser = async (query: string)=>{
  return await  Users.findOne({
    $or: [{ userName: query }, { email: query }],
  }).select('-password');

}
export const fetchUserMutedJobs = async(userId: string)=>{
  return Users.findById(userId).select('mutedJobs').lean();
}