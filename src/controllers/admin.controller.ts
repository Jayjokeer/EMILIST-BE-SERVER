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
import { ServiceEnum, WalletEnum } from "../enums/transaction.enum";
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
import { otpMessage, welcomeMessageAdmin } from "../utils/templates";
import { generateShortUUID, generateOTPData } from "../utils/utility";

export const adminDashboardController = catchAsync(async (req: JwtPayload, res: Response) => {
const {currency, year}= req.query; 

const data = {
    totalProducts: await productService.fetchAllProductsForAdmin(),
    totalUsers: await userService.fetchAllUsersAdminDashboard(),
    totalJobs: await jobService.fetchAllJobsForAdminDashboard(),
    totalPrivateExperts: await privateExpertService.fetchAllPrivateExpertsAAdminDashboard(),
    totalTransactions: await transactionService.fetchTransactionChartAdminDashboard(year, currency),
}

    return successResponse(res, StatusCodes.CREATED, data);
  });

export const fetchAllUsersAdminController = catchAsync(async (req: JwtPayload, res: Response) => {
      const {page, limit, q} = req.query;
    let userData = [];
    const {users, totalUsers}= await userService.fetchAllUsersAdmin(page, limit, q);
        for (const user of users){
        const subcription = await subscriptionService.getSubscriptionById(String(user.subscription));
        const plan = await planService.getPlanById(String(subcription!.planId));

        const transactions = await transactionService.fetchAllUserEarningsAdmin(String(user._id));
         userData.push({
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
    
