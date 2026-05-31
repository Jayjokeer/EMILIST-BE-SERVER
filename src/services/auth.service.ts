import { ICreateUser } from "../interfaces/user.interface";
import Users from "../models/users.model";
import Business from "../models/business.model";
import { ExpertProfileContext, UserProfileDto } from "../interfaces/business.interface";
import { Types } from "mongoose";
import { assertAllProfileFieldsPresent } from "../helpers/validation.helper";
import {  NotFoundError } from "../errors/error";


export const findUserByEmail = async (email: string) => {
    return await Users.findOne({email: email});
  };
export const findUserById = async (id: string)=>{
    return await Users.findById(id,{password: 0})
    .populate('wallets')
    .populate('subscription');
};
export const createUser = async (data:  ICreateUser) =>{
    return await Users.create(data);
};
export const findCurrentUserById = async (id: string)=>{
    return await Users.findById(id).select("fullName uniqueId email language isProfileComplete isVerified");
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
export const findUserByEmailOrUserNameDirectJob = async(user: string)=>{

  return await Users.findOne({ $or: [{ email: user }, { userName: user }] });
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

export const fetchAllUsersAdmin = async(page: number, limit: number, q: string, search: string)=>{
  const skip = (page - 1) * limit;
  let query: any = {};
  if(q === "verified"){
    query.isVerified = true;
  }else if (q === "requestVerification"){
    query.isVerified = false;
    query.requestedVerification = true;

  }
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { userName: searchRegex },
      { gender: searchRegex },
      { location: searchRegex },
      { uniqueId: searchRegex },
    ];
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
  return await Users.findById(id,{password: 0, 
    number1: 0, 
    number2: 0, 
    whatsAppNo: 0,
    registrationOtp: 0,
    email: 0,
    otpExpiresAt:0,
    passwordResetOtp: 0,
    googleId:0,
    accessToken: 0,
    businesses: 0,
    mutedJobs: 0,
    wallets: 0,
    role: 0,
    invitedUsers: 0,
    subscription: 0,
    requestedVerification: 0,
    comparedBusinesses: 0,
    comparedProducts: 0,
    accountDetails: 0,
    sharedCount: 0,
    mutedBusinesses: 0,
    isEmailVerified: 0,
    createdAt: 0,
    updatedAt: 0,
  });
};

export const deleteUser = async(userId: string)=>{
 return await Users.findByIdAndDelete(userId)
}

export const resolveExpertContext = async (
  userId: Types.ObjectId,
  forceNewBusiness = false
): Promise<ExpertProfileContext> => {
   const user = await Users.findById(userId).select(
    'isProfileComplete businesses'
  );
 
  if (!user) throw new Error('User not found');
 
  const hasBusiness = user.businesses && user.businesses.length > 0;
  const profileComplete = user.isProfileComplete === true;
 
  if (!hasBusiness && !profileComplete) return 'FIRST_JOIN';
 

  if (forceNewBusiness && profileComplete) return 'NEW_BUSINESS';
 
  if (hasBusiness && !profileComplete) return 'SETTINGS_FIRST';
 
  return 'SETTINGS_UPDATE';
};

export const getProfileContextService = async (
  userId: string,
  forceNewBusiness = false
): Promise<{ context: ExpertProfileContext; prefill: Partial<UserProfileDto> }> => {
  const userObjectId = new Types.ObjectId(userId);
  const context = await resolveExpertContext(userObjectId, forceNewBusiness);
 
  let prefill: Partial<UserProfileDto> = {};
 
  if (context === 'NEW_BUSINESS') {
    const user = await Users.findById(userObjectId).select(
      'firstName lastName mobile countryCode language houseAddress city state country bio displayImage'
    );
    if (user) {
      prefill = {
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        countryCode: user.countryCode,
        language: user.language,
        houseAddress: user.houseAddress,
        city: user.city,
        state: user.state,
        country: user.country,
        bio: user.bio,
        displayImage: user.displayImage,
      };
    }
  }
 
  return { context, prefill };
};
const pick = (v: string | undefined): string | undefined =>
  v !== undefined && v.trim() !== '' ? v.trim() : undefined;
 

export const buildProfilePayload = (dto: UserProfileDto) => {
  const userSet: Record<string, unknown> = {};
  const businessSet: Record<string, unknown> = {};
 
  if (pick(dto.firstName))    { userSet.firstName    = pick(dto.firstName);    businessSet.firstName    = pick(dto.firstName); }
  if (pick(dto.lastName))     { userSet.lastName     = pick(dto.lastName);     businessSet.lastName     = pick(dto.lastName); }
  if (pick(dto.countryCode))  { userSet.countryCode  = pick(dto.countryCode); }
  if (pick(dto.mobile))       { userSet.mobile       = pick(dto.mobile);       businessSet.phoneNumber  = pick(dto.mobile); }
  if (pick(dto.language))     { userSet.language     = pick(dto.language);     businessSet.languages    = [pick(dto.language)]; }
  if (pick(dto.houseAddress)) { userSet.houseAddress = pick(dto.houseAddress); businessSet.address      = pick(dto.houseAddress); }
  if (pick(dto.city))         { userSet.city         = pick(dto.city);         businessSet.city         = pick(dto.city); }
  if (pick(dto.state))        { userSet.state        = pick(dto.state);        businessSet.state        = pick(dto.state); }
  if (pick(dto.country))      { userSet.country      = pick(dto.country);      businessSet.country      = pick(dto.country); }
  if (pick(dto.bio))          { userSet.bio          = pick(dto.bio);          businessSet.bio          = pick(dto.bio); }
  if (pick(dto.displayImage)) { userSet.displayImage = pick(dto.displayImage); businessSet.profileImage = pick(dto.displayImage); }
 
  return { userSet, businessSet };
};
export const saveUserProfile = async (
  userId: string,
  dto: UserProfileDto,
  files: any
) => {
  try{
  const userObjectId = new Types.ObjectId(userId);
 
  const user = await Users.findById(userObjectId).select('isProfileComplete');
  if (!user) throw new NotFoundError('User not found');
 
  const isFirstTime = !user.isProfileComplete;
 
  if (isFirstTime) assertAllProfileFieldsPresent(dto);
     if (files && files['profileImage'] && files['profileImage'][0]) {
        dto.displayImage = files['profileImage'][0].path;
    }
  const { userSet } = buildProfilePayload(dto);
 
  if (isFirstTime) userSet.isProfileComplete = true;
 
  const updatedUser = await Users.findByIdAndUpdate(
    userObjectId,
    { $set: userSet },
    { new: true, runValidators: true }
  ).select('-password -registrationOtp -passwordResetOtp -otpExpiresAt');
 
  if (!updatedUser) throw new NotFoundError('User not found');
 
  return { isFirstTime, user: updatedUser };
}catch (error) { 
      console.error(`Error in saveUserProfile: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to save user profile: ${error instanceof Error ? error.message : String(error)}`);
  }
};