import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as productService from "../services/product.service";
import { IProduct } from "../interfaces/product.interface";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import * as reviewService from "../services/review.service";
import * as subscriptionService from "../services/subscription.service";
import { SubscriptionPerksEnum } from "../enums/suscribtion.enum";
import * as userService from "../services/auth.service";
import * as jobService from "../services/job.service";
import * as privateExpertService from "../services/private-expert.service";
import * as transactionService from "../services/transaction.service";
import { ServiceEnum, TransactionEnum, WalletEnum } from "../enums/transaction.enum";
import * as planService from "../services/plan.service";
import { UserStatus } from "../enums/user.enums";
import * as businessService from "../services/business.service";
import * as projectService from "../services/project.service";
import * as authService from "../services/auth.service";
import * as walletService from "../services/wallet.services";
import { PlanEnum } from "../enums/plan.enum";
import { ICreateUser } from "../interfaces/user.interface";
import { hashPassword } from "../utils/hashing";
import { sendEmail } from "../utils/send_email";
import { directJobApplicationMessage, otpMessage, welcomeMessageAdmin } from "../utils/templates";
import { generateShortUUID, generateOTPData } from "../utils/utility";
import { IJob } from "../interfaces/jobs.interface";
import mongoose from "mongoose";
import { JobType, MilestonePaymentStatus } from "../enums/jobs.enum";
import { ProjectStatusEnum } from "../enums/project.enum";

export const adminDashboardController = catchAsync(async (req: JwtPayload, res: Response) => {
const {currency, year}= req.query; 

const data = {
    totalProducts: await productService.fetchAllProductsForAdmin(),
    totalUsers: await userService.fetchAllUsersAdminDashboard(),
    totalJobs: await jobService.fetchAllJobsForAdminDashboard(),
    totalPrivateExperts: await privateExpertService.fetchCountPrivateExpertsAdminDashboard(),
    totalTransactions: await transactionService.fetchTransactionChartAdminDashboard(year, currency),
}

    return successResponse(res, StatusCodes.CREATED, data);
  });

export const fetchAllUsersAdminController = catchAsync(async (req: JwtPayload, res: Response) => {
      const {page, limit, q, search} = req.query;
    let userData = [];
    const {users, totalUsers}= await userService.fetchAllUsersAdmin(page, limit, q, search);
        for (const user of users){
        const subcription = await subscriptionService.getSubscriptionById(String(user.subscription));
        const plan = await planService.getPlanById(String(subcription!.planId));

        const transactions = await transactionService.fetchAllUserEarningsAdmin(String(user._id));
         userData.push({
            userName: user.userName,
            userId: user._id,
            name: user.fullName,
            email: user.email,
            status: user.status,
            subscription: plan?.name || null,
            dateRegistered: user.createdAt,
            totalEarnings: transactions || 0,
        })
    };

    const data = {
        users: userData,
        totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / limit),
    };
    return successResponse(res, StatusCodes.CREATED, data);
  });

export const verifyUserAdminController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {userId} = req.params;
    await userService.verifyUser(userId);
    return successResponse(res, StatusCodes.CREATED, 'User verified successfully');
  
});
export const suspendUserAdminController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {userId} = req.params;
   const user =  await userService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    }
    user.status =UserStatus.suspended;
    await user.save();
    return successResponse(res, StatusCodes.CREATED, 'User suspended successfully');
});

export const fetchUserDetails = catchAsync(async (req: JwtPayload, res: Response) => {
    const {userId} = req.params;
    const {q} = req.query;
    const user = await userService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    }
    let data = {
        profileImage: user.profileImage,
        name: user.fullName,
        level: user.level,
        uniqueId: user.uniqueId,
        fullName: user.fullName,
    };
    if(q ==="userDetails"){
    const payload = {
        email: user.email,
        userName: user.userName,
        phoneNumber: [user.number1, user.number2],
        whatsappNumber: user.whatsAppNo,
        bio: user.bio,
        languages: user.language,  
        location: user.location,
    };
    data = {...data, ...payload};
    }else if(q === "services"){
        const business = await businessService.fetchAllUserBusinessesAdmin(String(user._id));
       const payload = {
            businesses: business,
        }
        data = {...data, ...payload};

    } else if (q ==="jobs"){
        const jobs = await jobService.fetchAllUserJobsAdmin(String(user._id));
       const payload = {
            jobs,
        }
        data = {...data, ...payload};

    }else if (q === "projects"){
        const projects = await projectService.fetchAllUserProjectsAdmin(String(user._id));
      const payload = {
            projects,
        }
        data = {...data, ...payload};

    }else if (q === "materials"){
        const materials = await productService.fetchAllUserProductsAdmin(String(user._id));
        const payload = {
            materials,
        }
        data = {...data, ...payload};
    }else if (q === "subscriptions"){
        const subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(String(user._id));
        const subscriptionTransactions = await transactionService.fetchTransactionsByService(String(user._id),ServiceEnum.subscription);
        const plan = await planService.getPlanById(String(subscription!.planId));
        console.log(plan)
        const payload = {
            subscription,
            name: plan!.name,
            price: plan!.price,
            subscriptionTransactions,
        }
        data = {...data, ...payload};
    }
    return successResponse(res, StatusCodes.OK, data);
}); 
export const addUserAdminController = catchAsync(async (req: JwtPayload, res: Response) => {
        const {
          userName,
          email,
        } = req.body;
        const isEmailExists = await authService.findUserByEmail(email);
    
        if(isEmailExists) throw new BadRequestError("User with email already exists!");
    
        const isUserNameExists = await authService.findUserByUserName(userName);
        if(isUserNameExists) throw new BadRequestError("UserName already exists!");
    
        const user: ICreateUser= {
          userName,
          email: email.toLowerCase(),
          uniqueId:generateShortUUID()
        }
        const data = await authService.createUser(user);
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
        const {html, subject} = welcomeMessageAdmin(userName);
        sendEmail(email, subject,html); 
       return successResponse(res,StatusCodes.CREATED, data);
    });
    

export const fetchJobsAdminController = catchAsync(async(req: JwtPayload, res: Response) => {
    const {status, page =1 , limit = 10 , search} = req.query;
    let allJobs =[];
    const {totalJobs, jobs} = await jobService.fetchAllJobsAdmin(status, page, limit, search);
    for (const job of jobs){
        const user = await userService.findUserById(job.userId)
        allJobs.push( {
            jobId: job._id,
            title: job.title,
            poster: user?.fullName,
            userName: user?.userName, 
            createdAt: job.createdAt,
            status: job.status,
            type: job.type,
        });
    }
    const data = {
        jobs: allJobs,
        totalJobs,
        page,
        totalPages: Math.ceil(totalJobs / limit),
    };
    return successResponse(res,StatusCodes.OK, data);
});

export const fetchSingleJobAdminController = catchAsync(async(req: JwtPayload, res: Response) => {
    const {jobId} = req.params;
    const data = await jobService.fetchJobByIdWithDetails(jobId);
    
    return successResponse(res,StatusCodes.OK, data);
});

export const createJobAdminController = catchAsync( async (req: JwtPayload, res: Response) => {
    const job: IJob = req.body;

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const fileObjects = files.map((file) => ({
        id: new mongoose.Types.ObjectId(),
        url: file.path, 
      }));
      job.jobFiles = fileObjects;
    }
let user;
if (!req.body.identifier){
    throw new BadRequestError('uniqueId, user ID or email is required!') 
}
user  = await authService.findUserUsingUniqueIdEmailUserId(req.body.identifier);    
if(!user) throw new NotFoundError("User not found!");

  if(job.type == JobType.direct && (job.email || job.userName)){

      const userId = user.id;
      job.userId = userId;

      const data = await jobService.createJob(job);

      const payload:any = {
        job: data._id,
        user: user._id,
        creator: userId,
        directJobStatus: ProjectStatusEnum.pending,
      };
       const project = await projectService.createProject(payload);
       data.applications = [];
       data.applications!.push(String(project._id));
       data.acceptedApplicationId = String(project._id);
       data.save();
       const { html, subject } = directJobApplicationMessage(user.userName, req.user.userName, String(data._id));
       await sendEmail(user.email, subject, html); 
    return  successResponse(res,StatusCodes.CREATED, data);

  } else {
    
    job.userId = String(user._id);
    const data = await jobService.createJob(job);

    successResponse(res,StatusCodes.CREATED, data);
}
});

export const fetchAllMaterialsAdminController = catchAsync( async (req: JwtPayload, res: Response) => {
    const {q, page= 1, limit = 10, search} = req.query;

    let products;

    const {materials , totalMaterials} = await productService.fetchAllProductsAdmin(page, limit, search);

    if(q == 'inStock'){
       products = materials.filter((material: any) => material.availableQuantity > 0);
        
    }else if (q == 'outOfStock'){ 
        products = materials.filter((material: any)  => material.availableQuantity <= 0);
    }else {
        products= materials;
    }
    const data = {
        materials: products,
        totalMaterials,
        page,
        totalPages: Math.ceil(totalMaterials / limit),
    };
   return successResponse(res,StatusCodes.OK, data);

});

export const fetchSingleMaterialController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const {materialId} = req.params;

    const data = await productService.fetchProductByIdWithDetails(materialId);
   return successResponse(res,StatusCodes.OK, data);
});

export const fetchSubscriptionsController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{limit, page} = req.query;
    const {subscriptions ,  totalSubscriptions} = await subscriptionService.fetchAllSubscriptionsAdmin(limit, page);
    const data = {
        subscriptions,
        totalSubscriptions,
        page,
        totalPages: Math.ceil(totalSubscriptions / limit),
    };
   return successResponse(res,StatusCodes.OK, data);
});

export const fetchAllTransactionsAdminController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{limit, page, search} = req.query;
    const {transactions ,  totalTransactions} = await transactionService.fetchAllTransactionsAdmin(limit, page, search);
    const data = {
        transactions,
        totalTransactions,
        page,
        totalPages: Math.ceil(totalTransactions / limit),
    };
   return successResponse(res,StatusCodes.OK, data);
});

export const fetchSingleTransactionAdminController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{transactionId} = req.params;
    const data = await transactionService.fetchTransactionAdmin(transactionId);

   return successResponse(res,StatusCodes.OK, data);
});

export const updateVatController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{vat} = req.body;
    const data = await transactionService.changeVatServiceAdmin(vat);

   return successResponse(res,StatusCodes.OK, data);
});

export const fetchAllPrivateExpertsController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const {page =1, limit= 10} = req.query;

    const experts = await privateExpertService.fetchAllPrivateExpertsAdminDashboard(page, limit);
    const totalExperts = await privateExpertService.fetchCountPrivateExpertsAdminDashboard();
    const totalLikedExperts = experts.length;
    const data = {
        experts,
        totalPages: Math.ceil(totalLikedExperts / limit),
        totalExperts,
        page,
    };

   return successResponse(res,StatusCodes.OK, data);
});

export const fetchPrivateExpertByIdController = catchAsync( async (req: Request, res: Response) => {
    const {id} = req.params;
    const data = await privateExpertService.fetchPrivateExpertById(id);
    return successResponse(res,StatusCodes.OK, data);
});

export const updateJobPaymentStatusController = catchAsync( async (req: Request, res: Response) => {
    const {jobId} = req.params;
    const {status, milestoneId } = req.body;

    if(!jobId && !milestoneId){
        throw new NotFoundError("Ids required!");
    };
    const job = await jobService.fetchJobById(String(jobId));
    if(!job) throw new NotFoundError("Job not found!");
    const milestone = job.milestones.find((milestone: any) => String(milestone._id) === milestoneId);
    if (!milestone) {
        throw new NotFoundError("Milestone not found within this job!");
    }    
    milestone.paymentStatus = status;
    if(status === MilestonePaymentStatus.paid){
        milestone.datePaid =new Date();

    }
    
    await job.save();

    return successResponse(res,StatusCodes.OK, job);
});

export const addCategoriesController = catchAsync( async (req: Request, res: Response) => {
    const {category } = req.body;
    const payload = {
        category,
    };
    const data = await productService.createCategory(payload);

    return successResponse(res,StatusCodes.CREATED, data);
});

export const deleteCategoryController = catchAsync( async (req: Request, res: Response) => {
    const {id } = req.params;

    await productService.deleteCategory(id);

    return successResponse(res,StatusCodes.OK, "Category deleted successfully");
});

export const fetchSingleCategoryController = catchAsync( async (req: Request, res: Response) => {
    const {id} = req.params;

    const data = await productService.fetchSingleCategory(id);

    return successResponse(res,StatusCodes.OK, data);
});

export const fetchAllCategoriesController = catchAsync( async (req: Request, res: Response) => {

    const data = await productService.fetchAllCategories();

    return successResponse(res,StatusCodes.OK, data);
});

export const fetchUserAccountDetailsController = catchAsync( async (req: Request, res: Response) => {
    const {userId} = req.params;

    const user = await userService.findUserById(userId);
    if(!user){
        throw  new NotFoundError("user not found")
    }
    const data = {
        accountNumber: user?.accountDetails.number,
        bank: user?.accountDetails.bank,
        holderName:  user?.accountDetails.holdersName
    }
    return successResponse(res,StatusCodes.OK, data);
});