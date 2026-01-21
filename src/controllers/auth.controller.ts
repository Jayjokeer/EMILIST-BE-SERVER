import { NextFunction, Request, Response } from "express";
import { successResponse } from "../helpers/success-response";
import * as authService from '../services/auth.service';
import { ICreateUser, ISignUser } from "../interfaces/user.interface";
import { StatusCodes } from "http-status-codes";
import {  hashPassword ,  comparePassword  } from "../utils/hashing";
import { NotFoundError, BadRequestError, UnauthorizedError } from '../errors/error';
import { generateOTPData, generateShortUUID } from "../utils/utility";
import { generateJWTwithExpiryDate } from "../utils/jwt";
import { catchAsync } from "../errors/error-handler";
import { otpMessage, passwordResetMessage, sendInviteMessage } from "../utils/templates";
import { sendEmail } from "../utils/send_email";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../utils/config";
import { UserStatus } from "../enums/user.enums";
import axios from "axios";
import * as notificationService from "../services/notification.service";
import { NotificationTypeEnum } from "../enums/notification.enum";
import * as walletService from "../services/wallet.services";
import * as subscriptionService from "../services/subscription.service";
import * as planService from "../services/plan.service";
import { PlanEnum } from "../enums/plan.enum";
import { sub } from "date-fns";
import * as jobService from "../services/job.service";
import * as businessService from "../services/business.service";
import * as productService from "../services/product.service";
import * as newsLetterService from "../services/newsletter.service";
import * as verificationService from "../services/verification.service";

export const registerUserController = catchAsync( async (req: Request, res: Response) => {
    const {
      userName,
      email,
      password,
    } = req.body;
    const isEmailExists = await authService.findUserByEmail(email.toLowerCase());

    if(isEmailExists) throw new BadRequestError("User with email already exists!");

    const isUserNameExists = await authService.findUserByUserName(userName);
    if(isUserNameExists) throw new BadRequestError("UserName already exists!");
    const encryptPwd = await hashPassword(password);

    const user: ICreateUser= {
      userName,
      email: email.toLowerCase(),
      password: encryptPwd,
      uniqueId:generateShortUUID()
    };
    
    const data = await authService.createUser(user);
    const userId = String(data._id);
    const {otp, otpCreatedAt, otpExpiryTime} = await generateOTPData(userId);
    data.otpExpiresAt = otpExpiryTime;
    data.registrationOtp = otp;
    await data.save();
    const walletPayload ={
      userId: data._id,
      isDefault: true
    }
   const wallet = await walletService.createWallet(walletPayload);
   data.wallets.push(wallet._id);
   await data.save();
    const plan = await planService.getPlanByName(PlanEnum.basic); 
    if(!plan) throw new NotFoundError("Plan not found!");
    const subscription = await subscriptionService.createSubscription({userId: data._id, planId: plan._id, startDate: new Date(), perks: plan.perks});
    data.subscription = subscription._id;
    await data.save();
    const {html, subject} = otpMessage(userName, otp);
    sendEmail(email, subject,html); 
   return successResponse(res,StatusCodes.CREATED, data);
});

export const loginController = catchAsync(async (req: Request, res: Response) => {
  const {
    email,
    password
  } = req.body;

  const foundUser = await authService.findUserByEmail(email.toLowerCase());
  if(!foundUser) throw new NotFoundError("Invalid credentials!");
  if(!foundUser.password) throw new NotFoundError("Invalid credentials!");

  const pwdCompare = await comparePassword(password, foundUser.password);
  if(!pwdCompare) throw new NotFoundError("Invalid credentials!");

  if(foundUser.status == UserStatus.deactivated){
    throw new UnauthorizedError("Account Deactivated!!")
  }
  if(foundUser.status == UserStatus.suspended){
    throw new UnauthorizedError("Account Suspended kindly Contact Admin!!")
  }
  if(foundUser.isEmailVerified == false){
    throw new BadRequestError("Kindly verify your email!");
  }
  const token = await generateJWTwithExpiryDate({
    email: foundUser.email,
    id: foundUser._id,
    userName: foundUser.userName
  });
  const userData = await authService.findUserById(String(foundUser._id));
const user = {
  token,
  userData
};

  const checkWalletExists = await walletService.findUserWallet(String(foundUser._id));
if(!checkWalletExists){
  const wallet = await walletService.createWallet({userId: foundUser._id, isDefault: true});
  foundUser.wallets.push(wallet._id );
  await foundUser.save();
}

  return successResponse(res, StatusCodes.OK, user)
});

export const verifyEmailController = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");

  const tokenData = await authService.findTokenService(otp);
  if(!tokenData) throw new BadRequestError("Otp expired!");

  if(foundUser.registrationOtp !== tokenData.registrationOtp) throw new BadRequestError("Otp expired!");
  foundUser.isEmailVerified = true;
  foundUser.registrationOtp = undefined;
  foundUser.otpExpiresAt = undefined;
  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Email verified successfully!");
});

export const forgetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");

  const { otp, otpExpiryTime } = await generateOTPData(String(foundUser._id));
  foundUser.otpExpiresAt = otpExpiryTime;
  foundUser.passwordResetOtp = otp;
  await foundUser.save();

  const { html, subject } = passwordResetMessage(foundUser.userName, otp);
  await sendEmail(email, subject, html); 

  return successResponse(res, StatusCodes.OK, "Password reset OTP sent to your email.");
});

export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");

  if (foundUser.passwordResetOtp !== otp) throw new BadRequestError("Invalid OTP");
  if (foundUser.otpExpiresAt && Date.now() > foundUser.otpExpiresAt.getTime()) {
    throw new BadRequestError("OTP expired, request a new one.");
  }

  const hashedPassword = await hashPassword(newPassword);
  foundUser.password = hashedPassword;
  foundUser.passwordResetOtp = undefined;
  foundUser.otpExpiresAt = undefined;
  if(foundUser.isEmailVerified == false){
    foundUser.isEmailVerified = true;
  }
  await foundUser.save();
  const notificationPayload = {
    userId: foundUser._id,
    title: " Password Reset",
    message: "You just reset your password",
    type: NotificationTypeEnum.info
  }
  await notificationService.createNotification(notificationPayload);
  return successResponse(res, StatusCodes.OK, "Password reset successfully!");
});

export const updateUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user.id;
  
  const {
    fullName,
    gender,
    language,
    number1,
    number2,
    whatsAppNo,
    location,
    bio,
  } = req.body;

  const foundUser = await authService.findUserById(userId);
  if (!foundUser) throw new NotFoundError("User not found!");


  foundUser.fullName = fullName || foundUser.fullName;
  foundUser.gender = gender || foundUser.gender;
  foundUser.language = language || foundUser.language;
  foundUser.number1 = number1 || foundUser.number1;
  foundUser.number2 = number2 || foundUser.number2;
  foundUser.whatsAppNo = whatsAppNo || foundUser.whatsAppNo;
  foundUser.location = location || foundUser.location;
  foundUser.bio = bio || foundUser.bio;
  if (req.file) {
     foundUser.profileImage = req.file.path;
  }

  await foundUser.save();

  return successResponse(res, StatusCodes.OK, foundUser);
});
export const updateAccountDetailsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const email = req.user.email;
  
  const {
    password,
    number,
    holdersName,
    bank,
  } = req.body;
  const foundUser = await authService.findUserByEmail(email);
  if (!foundUser) throw new NotFoundError("User not found!");
  const pwdCompare = await comparePassword(password, foundUser.password);
  if(!pwdCompare) throw new NotFoundError("Invalid credentials!");

  foundUser.accountDetails.number = number;
  foundUser.accountDetails.holdersName = holdersName;
  foundUser.accountDetails.bank = bank;


  await foundUser.save();

  return successResponse(res, StatusCodes.OK, foundUser);
});
export const changePasswordController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId  = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const foundUser = await authService.findUserByIdWithPassword(userId);
  if (!foundUser) throw new NotFoundError("User not found!");

  const isPasswordValid = await comparePassword(currentPassword, foundUser.password);
  if (!isPasswordValid) throw new UnauthorizedError("Current password is incorrect!");

  const hashedNewPassword = await hashPassword(newPassword);
  foundUser.password = hashedNewPassword;

  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Password changed successfully!");
});

export const currentUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId  = req.user.id;

  const user = await authService.findUserById(userId);
  if (!user) throw new NotFoundError("User not found!");


  return successResponse(res, StatusCodes.OK, user);
});
export const uploadImage = catchAsync( async(req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = req.file.path;

  return successResponse(res, StatusCodes.OK, imageUrl);
});

export const uploadMultipleFiles = catchAsync( async(req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const fileUrls = files.map(file => file.path);


  return successResponse(res, StatusCodes.OK, fileUrls);
});

export const resendVerificationOtpController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Email is required");
  }

    const user = await authService.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email not verified!")
    }
    const userId = String(user._id);
    const {otp, otpCreatedAt, otpExpiryTime} = await generateOTPData(userId);
    user.otpExpiresAt = otpExpiryTime;
    user.registrationOtp = otp;
    await user.save();
    const {html, subject} =await otpMessage(user.userName, otp);
    await sendEmail(email, subject,html); 
    return successResponse(res, StatusCodes.OK, "Otp sent successfully");
});

export const googleRedirectController = catchAsync(async (req: Request, res: Response) => {
  const loggedIn = req.user as ISignUser;
  console.log('redirect controller')
  const token =  generateJWTwithExpiryDate({
    email: loggedIn.email,
    id: loggedIn.id,
    userName: loggedIn.userName,
  });
  const userData = await authService.findUserById(loggedIn.id);

  const queryParams = new URLSearchParams({
    id: userData!.id,
    email: userData!.email,
    userName: userData!.userName,
  }).toString();
  res.cookie('access_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  domain: '.emilist.com',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

  console.log(`${config.frontendUrl}?${queryParams}`)
 return res.redirect(`${config.frontendUrl}?${queryParams}`);
});

export const logoutController = catchAsync(async (req: JwtPayload, res: Response) => {
  const user = await authService.findUserById(req.user.id);

  if (user && user.accessToken) {
    await axios.get(`https://accounts.google.com/o/oauth2/revoke?token=${user.accessToken}`);

    user.accessToken = undefined;
    await user.save();
  }  return successResponse(res, StatusCodes.OK,  "Successfully logged out.");
});

export const deactivateUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const loggedIn = req.user as ISignUser;
  
  const deactivateUser = await authService.updateUserById(loggedIn.id,{status: UserStatus.deactivated});
  return successResponse(res, StatusCodes.OK,  "Successfully deactivated!");
});
export const findUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { user } = req.query;

  if (!user) {
    throw new BadRequestError("Query is required to search for a user");
  }
 
  const data = await authService.findSpecificUser(user);
  if (!data) {
    throw new NotFoundError("User not found!")
  }
  return successResponse(res, StatusCodes.OK, data);
});

export const inviteUserController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { email } = req.query;
  const userId = req.user._id;
  if(!email){
    throw new BadRequestError("Email is required!");
  };
  const user = await authService.findUserByEmail(email);
  if (user) {
    throw new NotFoundError("User is already on the platform!")
  }
  const loggedInUser = await authService.findUserById(userId);
  if (!loggedInUser) {
    throw new NotFoundError("User not found!")
  }
  loggedInUser.invitedUsers?.push(email);
  await loggedInUser.save();

  const {html, subject} = sendInviteMessage(req.user.userName, config.frontendSignUpUrl);
  await sendEmail(email, subject,html); 
  return successResponse(res, StatusCodes.OK, "Invite sent successfully");
});

export const requestVerificationController = catchAsync(async (req: JwtPayload, res: Response) => { 
  const {type, businessId, certificateId} = req.query;
  const userId = req.user._id;
  const user = await authService.findUserById(userId);
  if(!user){
    throw new NotFoundError("User not found!");
  }
  let verification;
  if(type == 'user'){
      user.requestedVerification = true;
      await user?.save();
      const payload ={
        userId,
        type
      }
      
     verification = await verificationService.createVerification(payload)
  }else if (type == 'business'){
    if(!businessId){
      throw new BadRequestError("businessID is required")
    }
    const business = await businessService.fetchSingleBusiness(businessId);
    if(!business){
      throw new NotFoundError("Business not found");
    };
    const payload ={
      userId,
      businessId,
      type,
    };
     verification = await verificationService.createVerification(payload)
  }else if (type == 'certificate'){
    if(!certificateId || !businessId){
      throw new BadRequestError("business and certificate id are required")
    }
    const business = await businessService.fetchSingleBusiness(businessId);
    if(!business){
      throw new NotFoundError("Business not found");
    }
    const certificate = business.certification!.find(
        (cert: any) => cert._id.toString() === certificateId.toString()
      );
      if(!certificate){
        throw new NotFoundError("Certificate not found for this business");
    
      }
    
      const payload ={
      userId,
      businessId,
      certificateId,
      type,
    }
    verification = await verificationService.createVerification(payload)

  }
  const data = {
    message: "Verification request sent successfully",
    verification
  }
  return successResponse(res, StatusCodes.OK,data );
});

export const insightsController = catchAsync(async (req: JwtPayload, res: Response) => { 
  const userId = req.user._id;
  const user = await authService.findUserWithoutDetailsById(userId);
  if(!user){
    throw new NotFoundError("User not found!");
  };
  let totalCount = 0;
  const uniqueClicks = new Set<string>();

  const totalJobClicks = await jobService.fetchAllUserJobsAdmin(userId);
  for (const job of totalJobClicks){
    totalCount += Number(job?.clicks?.clickCount || 0);
    if (job?.clicks?.userId) {
      uniqueClicks.add(String(job.clicks.userId));
    }
  };

  const totalMaterialsClicks = await productService.fetchAllUserProductsAdmin(userId);
  for (const material of totalMaterialsClicks){
    totalCount += Number(material?.clicks?.clickCount || 0);
    if (material?.clicks?.userId) {
      uniqueClicks.add(String(material.clicks.userId));
    }
  };

  const totalBusinessClicks = await businessService.fetchAllUserBusinessesAdmin(userId);
  for (const business of totalBusinessClicks ){
    totalCount += Number(business?.clicks?.clickCount || 0);
    if (business?.clicks?.userId) {
      uniqueClicks.add(String(business.clicks.userId));
    }
  };

  const subscription = await subscriptionService.getSubscriptionById(String(user.subscription));
  if(!subscription){
    throw new NotFoundError("subscription not found");
  }
    const startDate = subscription.startDate;
    const endDate = subscription.endDate
    const planId = subscription.planId;
    
  const plan = await planService.getPlanById(String(planId));
  if(!plan){
    throw new NotFoundError("No plan found")
  }
  let daysLeft = null;
  let daysUsed = null;

  if (plan.name !== PlanEnum.basic) {
    const today = new Date();
    const totalDays = Math.ceil((new Date(endDate!).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)); // Total subscription period in days
    const elapsedDays = Math.ceil((today.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)); // Days since subscription started
    daysUsed = elapsedDays;
    daysLeft = totalDays - elapsedDays;

    if (daysLeft < 0) {
      daysLeft = 0;
    }
  }

  const responseData = {
    subscription: {
      planName: plan.name,
      status: subscription.status,
    },
    daysUsed,
    daysLeft,
  };

  const jobLikes = await jobService.fetchAllLikedJobs(String(user._id));
  const productLikes = await productService.fetchAllLikedProducts(String(user._id));
  const businessLikes = await businessService.fetchAllLikedBusinesses(String(user._id));
  const totalSaved = jobLikes.totalLikedJobs + productLikes.totalProductsLikes + businessLikes.totalLikedBusinesses;
  const data = {
    saved: totalSaved,
    contact: user.invitedUsers?.length,
    shared: user.sharedCount,
    clicks: totalCount,
    reached: uniqueClicks.size,
    promotionDuration: responseData 
  };
  return successResponse(res, StatusCodes.OK, data);
});

export const countClicksController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { service, serviceId, userId } = req.query;

  if (!service ) {
    throw new BadRequestError('Service is required!');
  }
  if(! ['business', 'material', 'job', 'shared'].includes(service)){
    throw new BadRequestError("Invalid service type!");
  
  }
  let user;
  if (userId) {
    user = await authService.findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found!");
    }
  }

  let data;
  if (service === 'job') {
    const jobId = serviceId as string
    data = await jobService.fetchJobById(jobId);
    console.log(data)
    if (!data) {
      throw new NotFoundError("Job not found");
    }
  } else if (service === 'business') {
    data = await businessService.fetchSingleBusiness(serviceId);
    if (!data) {
      throw new NotFoundError("Business not found");
    }
  } else if (service === 'materials') {
    data = await productService.fetchProductById(serviceId);
    if (!data) {
      throw new NotFoundError("Material not found");
    }

  }else if(service === 'shared'){
    user!.sharedCount!+=1;
    await user?.save();
  }

   if(service !== 'shared'){
    if (userId ) {
    if (!data!.clicks.users.includes(userId)) { 
      data!.clicks.users.push(userId);
    }
  }
  data!.clicks.clickCount = (data!.clicks.clickCount || 0) + 1;

  await data!.save();
   };

  return successResponse(res, StatusCodes.OK, "Successful");
});

export const subscribeNewsLetterController = catchAsync(async (req: JwtPayload, res: Response) => { 
  const {email} = req.body;
    await newsLetterService.subscribeNewsLetter(email);

  return successResponse(res, StatusCodes.OK, "Newsletter subscribed successfully");
});

export const getUserDetailsController = catchAsync(async (req: JwtPayload, res: Response) => { 
  const {userId} = req.params;
   const data = await authService.findUserWithoutPhoneNumberDetailsById(userId);

  return successResponse(res, StatusCodes.OK, data);
});
