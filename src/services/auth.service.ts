import { ICreateUser } from "../interfaces/user.interface";
import Users from "../models/users.model"
export const findUserByEmail = async (email: string) => {
    return await Users.findOne({email: email});
  };
export const findUserById = async (id: string)=>{
    return await Users.findById(id,{password: 0}).populate({
      path: 'businesses',
      select: 'businessId businessName', 
    }).populate('wallets')
    .populate('subscription');
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
};   
export const findSpecificUser = async (query: string)=>{
  return await  Users.findOne({
    $or: [{ userName: query }, { email: query }],
  }).select('-password');

};
export const fetchUserMutedJobs = async(userId: string)=>{
  return Users.findById(userId).select('mutedJobs').lean();
};
export const fetchUserMutedBusinesses = async(userId: string)=>{
  return Users.findById(userId).select('mutedBusinesses').lean();
};
export const fetchAllUsersAdminDashboard = async()=>{
  return await Users.countDocuments();
};

export const fetchAllUsersAdmin = async(page: number, limit: number, q: string)=>{
  const skip = (page - 1) * limit;
  let query: any = {};
  if(q === "verified"){
    query.isVerified = true;
  }else if (q === "requestVerification"){
    query.isVerified = false;
    query.requestedVerification = true;

  }
  const totalUsers = await Users.countDocuments(query);

  const users = await Users.find(query)
    .skip(skip)
    .limit(limit)
    return {users, totalUsers}
  };

  export const verifyUser = async (userId: string)=>{
    return await Users.findByIdAndUpdate(userId, { $set: { isVerified: true } }, { new: true });
  };
 
  export const findUserUsingUniqueIdEmailUserId = async(identifier: string)=>{
   return  await Users.findOne({
      $or: [
        { _id: identifier }, 
        { username: identifier }, 
        { uniqueId: identifier }, 
      ],
    });
  }

  export const findUserWithoutDetailsById = async (id: string)=>{
    return await Users.findById(id,{password: 0})
};
export const findUserWithoutPhoneNumberDetailsById = async (id: string)=>{
  return await Users.findById(id,{password: 0, number1: 0, number2: 0, whatsAppNo: 0});
};