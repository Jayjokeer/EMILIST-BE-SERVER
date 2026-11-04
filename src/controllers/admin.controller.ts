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
import { AdminOnboardingStatus, UserStatus, VerificationEnum } from "../enums/user.enums";
import * as businessService from "../services/business.service";
import * as projectService from "../services/project.service";
import * as authService from "../services/auth.service";
import * as walletService from "../services/wallet.services";
import { PlanEnum } from "../enums/plan.enum";
import { ICreateUser } from "../interfaces/user.interface";
import { sendEmail } from "../utils/send_email";
import { adminCreatedCustomerMessage, adminCustomerMessage, adminInvitationMessage, customerPasswordResetMessage, directJobApplicationMessage, passwordResetMessage, welcomeMessageAdmin } from "../utils/templates";
import { generateShortUUID } from "../utils/utility";
import { IJob } from "../interfaces/jobs.interface";
import mongoose from "mongoose";
import { JobType, MilestonePaymentStatus, QuoteStatusEnum } from "../enums/jobs.enum";
import { ProjectStatusEnum } from "../enums/project.enum";
import * as verificationService from "../services/verification.service";
import { OrderPaymentStatus } from "../enums/order.enum";
import * as  adminService from "../services/admin.service";
import {  hashPassword ,  comparePassword  } from "../utils/hashing";
import { generateAdminFlowToken, generateJWTwithExpiryDate, verifyAdminFlowToken } from "../utils/jwt";
import { NotificationTypeEnum } from "../enums/notification.enum";
import {
  ADMIN_INVITATION_TTL_MS,
  assertPasswordNotReused,
  assertStrongAdminPassword,
  createAuthenticatorEnrollment,
  decryptMfaSecret,
  encryptMfaSecret,
  PASSWORD_HISTORY_LIMIT,
  verifyAuthenticatorCode,
} from "../services/admin-onboarding.service";
import { config } from "../utils/config";
import * as adminCustomerService from "../services/admin-customer.service";
import * as notificationService from "../services/notification.service";
import * as adminOverviewService from "../services/admin-overview.service";
import * as adminJobService from "../services/admin-job.service";
import * as supportRequestService from "../services/support-request.service";
import * as adminJobDocumentService from "../services/admin-job-document.service";
import * as adminMaterialService from "../services/admin-material.service";
import * as adminPaymentService from "../services/admin-payment.service";
import * as adminPaymentDocumentService from "../services/admin-payment-document.service";

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

export const adminOverviewController = catchAsync(async (req: Request, res: Response) => {
  const range = typeof req.query.range === "string" ? req.query.range : undefined;
  return successResponse(res, StatusCodes.OK, await adminOverviewService.fetchAdminOverview(range));
});

export const adminJobSummaryController = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.fetchAdminJobSummary());
});

export const adminJobsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.fetchAdminJobs(req.query));
});

export const adminJobDetailsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.fetchAdminJobDetails(String(req.params.jobId)));
});

export const adminJobApplicantsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.fetchAdminJobApplicants(String(req.params.jobId), req.query));
});

export const adminJobInvoicesController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.fetchAdminJobInvoices(String(req.params.jobId)));
});

export const adminJobPaymentsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.fetchAdminJobPayments(String(req.params.jobId)));
});

export const downloadAdminJobInvoiceController = catchAsync(async (req: Request, res: Response) => {
  const buffer = await adminJobDocumentService.buildAdminJobInvoicePdf(String(req.params.jobId), String(req.params.invoiceId));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="job-invoice-${String(req.params.invoiceId).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`);
  return res.status(StatusCodes.OK).send(buffer);
});

export const downloadAdminJobPaymentReceiptController = catchAsync(async (req: Request, res: Response) => {
  const buffer = await adminJobDocumentService.buildAdminJobPaymentReceiptPdf(String(req.params.jobId), String(req.params.paymentId));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="job-payment-${String(req.params.paymentId).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`);
  return res.status(StatusCodes.OK).send(buffer);
});

export const adminJobActionController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminJobService.applyAdminJobAction(
    String(req.params.jobId), requestingAdminId(req), req.body,
  ));
});

export const supportRequestsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await supportRequestService.fetchSupportRequests(req.query));
});

export const supportRequestController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await supportRequestService.fetchSupportRequest(String(req.params.requestId)));
});

export const updateSupportRequestController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await supportRequestService.updateSupportRequest(
    String(req.params.requestId), requestingAdminId(req), req.body,
  ));
});

export const adminMaterialSummaryController = catchAsync(async (req: Request, res: Response) => {
  const range = typeof req.query.range === "string" ? req.query.range : undefined;
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterialSummary(range));
});

export const adminMaterialsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterials(req.query));
});

export const adminMaterialDetailsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterialDetails(String(req.params.productId), req.query));
});

export const adminMaterialReviewsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterialReviews(String(req.params.productId), req.query));
});

export const adminMaterialProductOrdersController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterialOrders(req.query, String(req.params.productId)));
});

export const delistAdminMaterialController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.delistAdminMaterial(
    String(req.params.productId), requestingAdminId(req), req.body.reason,
  ));
});

export const adminMaterialOrdersController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterialOrders(req.query));
});

export const adminMaterialOrderDetailsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.fetchAdminMaterialOrderDetails(String(req.params.orderId), req.query));
});

export const initiateAdminMaterialOrderReturnController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminMaterialService.initiateAdminOrderReturn(
    String(req.params.orderId), requestingAdminId(req), req.body.reason,
  ));
});

export const adminPaymentSummaryController = catchAsync(async (req: Request, res: Response) => {
  const range = typeof req.query.range === "string" ? req.query.range : undefined;
  const currency = typeof req.query.currency === "string" ? req.query.currency : undefined;
  return successResponse(res, StatusCodes.OK, await adminPaymentService.fetchAdminPaymentSummary(range, currency));
});

export const adminPaymentsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminPaymentService.fetchAdminPayments(req.query));
});

export const adminPaymentDetailsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminPaymentService.fetchAdminPayment(String(req.params.transactionId)));
});

export const downloadAdminPaymentPdfController = catchAsync(async (req: Request, res: Response) => {
  const transactionId = String(req.params.transactionId);
  const buffer = await adminPaymentDocumentService.buildAdminPaymentPdf(transactionId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="transaction-${transactionId.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`);
  return res.status(StatusCodes.OK).send(buffer);
});

export const adminWithdrawalsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminPaymentService.fetchAdminWithdrawals(req.query));
});

export const approveAdminWithdrawalController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminPaymentService.processAdminWithdrawal(
    String(req.params.transactionId), requestingAdminId(req), "approve", req.body.reason,
  ));
});

export const declineAdminWithdrawalController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminPaymentService.processAdminWithdrawal(
    String(req.params.transactionId), requestingAdminId(req), "decline", req.body.reason,
  ));
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
            name: user.firstName + " " + user.lastName,
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
    const {verificationId} = req.query;
    const verification = await verificationService.findById(verificationId);

    if(!verification){
        throw new NotFoundError("Verification not found");

    }
    if(verification.paymentStatus !== OrderPaymentStatus.paid){
        throw new BadRequestError("You cannot complete this verification as it has not been paid")
    }
    if(verification.type === VerificationEnum.user){
        await userService.verifyUser(String(verification.userId));
        verification.status = QuoteStatusEnum.accepted;
        await verification.save();
     return successResponse(res, StatusCodes.CREATED, 'User verified successfully');

    }else if(verification.type === VerificationEnum.business){
    await businessService.verifyBusinessAdmin(String(verification.businessId));
        verification.status = QuoteStatusEnum.accepted;
        await verification.save();
        return successResponse(res, StatusCodes.CREATED, 'Business verified successfully');

    }else if(verification.type === VerificationEnum.certificate ){
     const {message, certificate}  = await businessService.verifyCertificateAdmin(String(verification.businessId), String(verification.certificateId));
        verification.status = QuoteStatusEnum.accepted;
        await verification.save();
     return successResponse(res, StatusCodes.CREATED, message);

    }
  
});
export const suspendUserAdminController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {userId} = req.params;
   const user =  await userService.findUserById(userId);
    if(!user){
        throw new NotFoundError("User not found");
    }
    if(user.status === UserStatus.suspended){
        user.status = UserStatus.active;

    }else {
        user.status = UserStatus.suspended;
    }
    
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
        profileImage: user.displayImage,
        name: user.firstName + " " + user.lastName,
        level: user.level,
        uniqueId: user.uniqueId,
        fullName: user.firstName + " " + user.lastName,
        status: user.status,
        accountDetails: user.accountDetails,
    };
    if(q ==="userDetails"){
    const payload = {
        email: user.email,
        userName: user.userName,
        phoneNumber: user.mobile,
        bio: user.bio,
        languages: user.languages || [],  
        location: user.houseAddress,
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
            poster: user?.firstName + " " + user?.lastName,
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

export const fetchSubscriptionsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { limit = 10, page = 1, search = "", status } = req.query;

  const {
    subscriptions,
    totalSubscriptions,
    totalBasic,
    totalSilver,
    totalGold,
    totalPlatinum,
  } = await subscriptionService.fetchAllSubscriptionsAdmin(
    Number(limit),
    Number(page),
    search as string,
    status as string
  );

  const data = {
    subscriptions,
    totalSubscriptions,
    totalBasic,
    totalSilver,
    totalGold,
    totalPlatinum,
    page: Number(page),
    totalPages: Math.ceil(totalSubscriptions / Number(limit)),
  };

  return successResponse(res, StatusCodes.OK, data);
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

// Withdrawals require manual admin approval before the Paystack transfer goes out
export const approveWithdrawalController = catchAsync(async (req: JwtPayload, res: Response) => {
  const transaction = await walletService.approveWithdrawal(req.params.transactionId);
  return successResponse(res, StatusCodes.OK, {
    transactionId: transaction._id,
    reference: transaction.reference,
    status: transaction.status,
    transferCode: transaction.transferCode || null,
    amount: transaction.amount,
    currency: transaction.currency,
  });
});

export const declineWithdrawalController = catchAsync(async (req: JwtPayload, res: Response) => {
  const transaction = await walletService.declineWithdrawal(req.params.transactionId);
  const wallet = await walletService.findWalletById(String(transaction.walletId));
  return successResponse(res, StatusCodes.OK, {
    transactionId: transaction._id,
    reference: transaction.reference,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    balance: wallet?.balance ?? null,
  });
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
    const data = await privateExpertService.fetchPrivateExpertById(String(id));
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
        milestone.paymentStatus = MilestonePaymentStatus.paid
        const transaction = await transactionService.fetchSingleTransactionByMilestoneId(String(milestone._id));
        if(!transaction){
            throw new NotFoundError('Transaction not found!');
        }
        transaction.status = TransactionEnum.completed;
        transaction.isSettled = true;
        await transaction.save();
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

    await productService.deleteCategory(String(id));

    return successResponse(res,StatusCodes.OK, "Category deleted successfully");
});

export const fetchSingleCategoryController = catchAsync( async (req: Request, res: Response) => {
    const {id} = req.params;

    const data = await productService.fetchSingleCategory(String(id));

    return successResponse(res,StatusCodes.OK, data);
});

export const fetchAllCategoriesController = catchAsync( async (req: Request, res: Response) => {

    const data = await productService.fetchAllCategories();

    return successResponse(res,StatusCodes.OK, data);
});

export const fetchUserAccountDetailsController = catchAsync( async (req: Request, res: Response) => {
    const {userId} = req.params;

    const user = await userService.findUserById(String(userId));
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

export const fetchUserSubscriptionsController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{limit, page} = req.query;
    const {userId} = req.params;

    const {subscriptions ,  totalSubscriptions} = await subscriptionService.fetchAllUserSubscriptionsAdmin(limit, page, userId);
    const data = {
        subscriptions,
        totalSubscriptions,
        page: Number(page),
        totalPages: Math.ceil(totalSubscriptions / limit),
    };
   return successResponse(res,StatusCodes.OK, data);
});

export const fetchAllVerificationsController = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{limit, page} = req.query;

    const data = await verificationService.fetchAllVerifications(page, limit);

   return successResponse(res,StatusCodes.OK, data);
});

const adminResponse = (admin: any) => ({
  id: admin._id,
  fullName: admin.fullName,
  email: admin.email,
  mobile: admin.mobile || null,
  department: admin.department,
  role: admin.role,
  status: admin.status,
  onboardingStatus: admin.onboardingStatus,
  mfaEnabled: admin.mfaEnabled,
});

const getValidInvitation = async (token: string) => {
  const admin = await adminService.getAdminByInvitationToken(token);
  if (!admin) throw new NotFoundError("Invitation is invalid or has already been used");
  if (!admin.invitationExpiresAt || admin.invitationExpiresAt.getTime() <= Date.now()) {
    throw new BadRequestError("Invitation has expired. Ask a Super Admin to send a new one");
  }
  return admin;
};

export const createAdminController = catchAsync(async(req: JwtPayload, res: Response)=>{
  const { fullName, mobile, email, department, role } = req.body;
  const normalizedEmail = email.toLowerCase();
  const isEmailExists = await adminService.getAdminByEmail(normalizedEmail);
  if (isEmailExists) throw new BadRequestError("An admin with this email already exists");

  const { token, tokenHash } = adminService.createInvitationToken();
  const invitationExpiresAt = new Date(Date.now() + ADMIN_INVITATION_TTL_MS);
  const admin = await adminService.createAdmin({
    fullName,
    mobile,
    email: normalizedEmail,
    department,
    role,
    onboardingStatus: AdminOnboardingStatus.invited,
    invitationTokenHash: tokenHash,
    invitationExpiresAt,
  });

  const adminFrontendUrl = config.adminFrontendUrl || config.frontendLoginUrl || "";
  const separator = adminFrontendUrl.includes("?") ? "&" : "?";
  const invitationUrl = `${adminFrontendUrl}${separator}invite=${encodeURIComponent(token)}`;
  const { html, subject } = adminInvitationMessage(fullName, invitationUrl);
  await sendEmail(normalizedEmail, subject, html);

  return successResponse(res, StatusCodes.CREATED, {
    admin: adminResponse(admin),
    invitationExpiresAt,
  });
});

export const inspectAdminInvitationController = catchAsync(async(req: Request, res: Response)=>{
  const admin = await getValidInvitation(String(req.params.token));
  return successResponse(res, StatusCodes.OK, {
    admin: adminResponse(admin),
    nextStep: admin.onboardingStatus === AdminOnboardingStatus.invited ? "password" : "authenticator",
    invitationExpiresAt: admin.invitationExpiresAt,
  });
});

export const setAdminOnboardingPasswordController = catchAsync(async(req: Request, res: Response)=>{
  const { token, password, confirmPassword } = req.body;
  const admin = await getValidInvitation(token);
  if (admin.onboardingStatus !== AdminOnboardingStatus.invited) {
    throw new BadRequestError("Password has already been created for this invitation");
  }

  assertStrongAdminPassword(password, confirmPassword);
  await assertPasswordNotReused(password, admin.password, admin.passwordHistory);
  const enrollment = createAuthenticatorEnrollment(admin.email);

  admin.password = await hashPassword(password);
  admin.passwordHistory = [];
  admin.mfaSecret = encryptMfaSecret(enrollment.secret);
  admin.onboardingStatus = AdminOnboardingStatus.authenticatorPending;
  admin.invitationAcceptedAt = new Date();
  await admin.save();

  return successResponse(res, StatusCodes.OK, {
    admin: adminResponse(admin),
    authenticator: {
      secret: enrollment.secret,
      otpauthUri: enrollment.otpauthUri,
      issuer: "Emilist Admin",
      accountName: admin.email,
    },
  });
});

export const getAdminAuthenticatorSetupController = catchAsync(async(req: Request, res: Response)=>{
  const admin = await getValidInvitation(req.body.token);
  if (admin.onboardingStatus !== AdminOnboardingStatus.authenticatorPending || !admin.mfaSecret) {
    throw new BadRequestError("Create your password before setting up the authenticator");
  }
  const enrollment = createAuthenticatorEnrollment(admin.email, decryptMfaSecret(admin.mfaSecret));
  return successResponse(res, StatusCodes.OK, {
    secret: enrollment.secret,
    otpauthUri: enrollment.otpauthUri,
    issuer: "Emilist Admin",
    accountName: admin.email,
  });
});

export const activateAdminAccountController = catchAsync(async(req: Request, res: Response)=>{
  const { token, code } = req.body;
  const admin = await getValidInvitation(token);
  if (admin.onboardingStatus !== AdminOnboardingStatus.authenticatorPending || !admin.mfaSecret) {
    throw new BadRequestError("Authenticator setup is not ready for verification");
  }
  if (!verifyAuthenticatorCode(decryptMfaSecret(admin.mfaSecret), code)) {
    throw new BadRequestError("Invalid authenticator code");
  }

  admin.mfaEnabled = true;
  admin.mfaVerifiedAt = new Date();
  admin.isEmailVerified = true;
  admin.onboardingStatus = AdminOnboardingStatus.active;
  admin.invitationTokenHash = undefined;
  admin.invitationExpiresAt = undefined;
  admin.lastLoginAt = new Date();
  await admin.save();

  const authToken = generateJWTwithExpiryDate({ email: admin.email, id: admin._id });
  return successResponse(res, StatusCodes.OK, { token: authToken, admin: adminResponse(admin) });
});

export const loginAdminController = catchAsync(async (req: Request, res: Response) => {
  const {
    email,
    password
  } = req.body;

  const foundUser = await adminService.getAdminForAuthentication(email.toLowerCase());
  if(!foundUser || !foundUser.password) throw new UnauthorizedError("Invalid credentials");

  const userPwd: string = foundUser.password as string
  const pwdCompare = await comparePassword(password, userPwd);
  if(!pwdCompare) throw new UnauthorizedError("Invalid credentials");

  if(foundUser.status == UserStatus.deactivated){
    throw new UnauthorizedError("Account Deactivated!!")
  }
  if(foundUser.status == UserStatus.suspended){
    throw new UnauthorizedError("Account Suspended kindly Contact Admin!!")
  }
  if (!foundUser.mfaEnabled) {
    if (foundUser.invitationTokenHash) throw new UnauthorizedError("Account onboarding is incomplete");

    const enrollment = createAuthenticatorEnrollment(
      foundUser.email,
      foundUser.mfaSecret ? decryptMfaSecret(foundUser.mfaSecret) : undefined,
    );
    foundUser.mfaSecret = encryptMfaSecret(enrollment.secret);
    foundUser.onboardingStatus = AdminOnboardingStatus.authenticatorPending;
    await foundUser.save();
    const enrollmentToken = generateAdminFlowToken({
      email: foundUser.email,
      id: String(foundUser._id),
      purpose: "admin_mfa_enrollment",
    }, "15m");
    return successResponse(res, StatusCodes.OK, {
      mfaEnrollmentRequired: true,
      enrollmentToken,
      authenticator: {
        secret: enrollment.secret,
        otpauthUri: enrollment.otpauthUri,
        issuer: "Emilist Admin",
        accountName: foundUser.email,
      },
    });
  }
  if (foundUser.onboardingStatus !== AdminOnboardingStatus.active) {
    throw new UnauthorizedError("Account onboarding is incomplete");
  }

  const challengeToken = generateAdminFlowToken({
    email: foundUser.email,
    id: String(foundUser._id),
    purpose: "admin_mfa_login",
  });
  return successResponse(res, StatusCodes.OK, { mfaRequired: true, challengeToken });
});

export const verifyAdminLoginMfaController = catchAsync(async (req: Request, res: Response) => {
  const { challengeToken, code } = req.body;
  const challenge = verifyAdminFlowToken(challengeToken, "admin_mfa_login");
  const admin = await adminService.getAdminForAuthentication(challenge.email.toLowerCase());
  if (!admin || String(admin._id) !== challenge.id || !admin.mfaEnabled || !admin.mfaSecret) {
    throw new UnauthorizedError("Invalid sign-in challenge");
  }
  if (admin.status !== UserStatus.active) throw new UnauthorizedError("Admin account is not active");
  if (!verifyAuthenticatorCode(decryptMfaSecret(admin.mfaSecret), code)) {
    throw new BadRequestError("Invalid authenticator code");
  }

  admin.lastLoginAt = new Date();
  await admin.save();
  const token = generateJWTwithExpiryDate({ email: admin.email, id: admin._id });
  return successResponse(res, StatusCodes.OK, { token, admin: adminResponse(admin) });
});

export const activateLegacyAdminMfaController = catchAsync(async (req: Request, res: Response) => {
  const { enrollmentToken, code } = req.body;
  const challenge = verifyAdminFlowToken(enrollmentToken, "admin_mfa_enrollment");
  const admin = await adminService.getAdminForAuthentication(challenge.email.toLowerCase());
  if (!admin || String(admin._id) !== challenge.id || admin.mfaEnabled || !admin.mfaSecret) {
    throw new UnauthorizedError("Invalid authenticator enrollment challenge");
  }
  if (!verifyAuthenticatorCode(decryptMfaSecret(admin.mfaSecret), code)) {
    throw new BadRequestError("Invalid authenticator code");
  }

  admin.mfaEnabled = true;
  admin.mfaVerifiedAt = new Date();
  admin.isEmailVerified = true;
  admin.onboardingStatus = AdminOnboardingStatus.active;
  admin.lastLoginAt = new Date();
  await admin.save();
  const token = generateJWTwithExpiryDate({ email: admin.email, id: admin._id });
  return successResponse(res, StatusCodes.OK, { token, admin: adminResponse(admin) });
});

export const changeStatusAdmin = catchAsync(async(req: JwtPayload, res: Response)=>{
    const{status, id} = req.body;

    const admin = await adminService.getAdminById(id)
    if(!admin){
        throw new NotFoundError('Admin not found')
    }

    admin.status = status;
    await admin.save();
   return successResponse(res,StatusCodes.OK,"Admin status changed");
});

export const forgetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();
  const admin = await adminService.getAdminForAuthentication(normalizedEmail);

  if (admin && admin.status === UserStatus.active && admin.mfaEnabled && admin.mfaSecret) {
    const { token, tokenHash } = adminService.createPasswordResetToken();
    admin.passwordResetTokenHash = tokenHash;
    admin.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    admin.passwordResetAuthorizationHash = undefined;
    admin.passwordResetAuthorizationExpiresAt = undefined;
    admin.passwordResetOtp = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save();

    const adminFrontendUrl = config.adminFrontendUrl || config.frontendLoginUrl || "";
    const resetUrl = `${adminFrontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
    const { html, subject } = passwordResetMessage(String(admin.fullName || "Admin"), resetUrl);
    try {
      await sendEmail(normalizedEmail, subject, html);
    } catch (error) {
      // Preserve the same public response for existing and non-existing accounts.
      console.error("Admin password reset email failed:", error);
    }
  }

  return successResponse(res, StatusCodes.OK, {
    message: `If an admin account exists for ${normalizedEmail}, a reset link is on its way.`,
    expiresInMinutes: 30,
  });
});

const getValidPasswordReset = async (token: string) => {
  const admin = await adminService.getAdminByPasswordResetToken(token);
  if (!admin || !admin.passwordResetExpiresAt || admin.passwordResetExpiresAt.getTime() <= Date.now()) {
    throw new BadRequestError("This reset link is invalid or has expired");
  }
  if (admin.status !== UserStatus.active || !admin.mfaEnabled || !admin.mfaSecret) {
    throw new UnauthorizedError("This account cannot be reset using this link");
  }
  return admin;
};

export const inspectAdminPasswordResetController = catchAsync(async (req: Request, res: Response) => {
  const admin = await getValidPasswordReset(String(req.params.token));
  return successResponse(res, StatusCodes.OK, {
    admin: adminResponse(admin),
    nextStep: "authenticator",
    expiresAt: admin.passwordResetExpiresAt,
  });
});

export const verifyAdminPasswordResetMfaController = catchAsync(async (req: Request, res: Response) => {
  const { token, code } = req.body;
  const admin = await getValidPasswordReset(token);
  if (!verifyAuthenticatorCode(decryptMfaSecret(admin.mfaSecret!), code)) {
    throw new BadRequestError("Invalid authenticator code");
  }

  const authorization = adminService.createPasswordResetToken();
  admin.passwordResetTokenHash = undefined;
  admin.passwordResetExpiresAt = undefined;
  admin.passwordResetAuthorizationHash = authorization.tokenHash;
  admin.passwordResetAuthorizationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await admin.save();

  return successResponse(res, StatusCodes.OK, {
    authorizationToken: authorization.token,
    expiresInMinutes: 10,
    admin: adminResponse(admin),
  });
});

export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { authorizationToken, password, confirmPassword } = req.body;

  const foundUser = await adminService.getAdminByPasswordResetAuthorization(authorizationToken);
  if (
    !foundUser ||
    !foundUser.passwordResetAuthorizationExpiresAt ||
    foundUser.passwordResetAuthorizationExpiresAt.getTime() <= Date.now()
  ) {
    throw new BadRequestError("Password reset authorization is invalid or has expired");
  }

  assertStrongAdminPassword(password, confirmPassword);
  await assertPasswordNotReused(password, foundUser.password, foundUser.passwordHistory);
  const previousPassword = foundUser.password;
  const hashedPassword = await hashPassword(password);
  foundUser.password = hashedPassword;
  foundUser.passwordHistory = previousPassword
    ? [previousPassword, ...(foundUser.passwordHistory || [])].slice(0, PASSWORD_HISTORY_LIMIT)
    : foundUser.passwordHistory;
  foundUser.passwordResetOtp = undefined;
  foundUser.otpExpiresAt = undefined;
  foundUser.passwordResetTokenHash = undefined;
  foundUser.passwordResetExpiresAt = undefined;
  foundUser.passwordResetAuthorizationHash = undefined;
  foundUser.passwordResetAuthorizationExpiresAt = undefined;
  await foundUser.save();

  return successResponse(res, StatusCodes.OK, "Password reset successfully");
});

export const fetchAdminsController = catchAsync(async (req: Request, res: Response) => {
  const { page =1, limit=10, search } = req.query;
    const {admins, totalAdmins} = await adminService.fetchAllAdmins( Number(page), Number(limit), String(search))
    const data = {
        admins, 
        totalAdmins,
        page,
        totalPages: Math.ceil(totalAdmins / Number(limit)),

    }
  return successResponse(res, StatusCodes.OK, data);
});

const requestingAdminId = (req: Request) => String((req as any).user?._id || (req as any).user?.id);
const customerResetUrl = (token: string) => {
  const frontendUrl = config.customerFrontendUrl || config.frontendLoginUrl || "";
  return `${frontendUrl.replace(/\/$/, "")}/reset-password?adminToken=${encodeURIComponent(token)}`;
};

export const customerSummaryController = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerSummary());
});

export const customersController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomers(req.query));
});

export const customerOverviewController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerOverview(String(req.params.customerId)));
});

export const customerDetailsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerDetails(String(req.params.customerId)));
});

export const customerServicesController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerServices(String(req.params.customerId)));
});

export const customerJobsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerJobs(String(req.params.customerId), req.query));
});

export const customerListingsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerListings(String(req.params.customerId), req.query));
});

export const customerOrdersController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerOrders(String(req.params.customerId), req.query));
});

export const customerSalesController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerSales(String(req.params.customerId), req.query));
});

export const customerTransactionsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerTransactions(String(req.params.customerId), req.query));
});

export const customerSubscriptionsController = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, StatusCodes.OK, await adminCustomerService.fetchCustomerSubscriptions(String(req.params.customerId), req.query));
});

export const createCustomerController = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  const user = await adminCustomerService.createCustomer({
    ...req.body,
    displayImage: file?.path || req.body.displayImage,
  }, requestingAdminId(req));
  const reset = await adminCustomerService.createCustomerPasswordReset(String(user._id), requestingAdminId(req));
  const { html, subject } = adminCreatedCustomerMessage(
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "there",
    customerResetUrl(reset.token),
  );
  let emailSent = true;
  try {
    await sendEmail(user.email, subject, html);
  } catch (error) {
    emailSent = false;
    console.error("Customer setup email failed:", error);
  }
  return successResponse(res, StatusCodes.CREATED, {
    ...(await adminCustomerService.fetchCustomerOverview(String(user._id))),
    emailSent,
  });
});

export const updateCustomerProfileController = catchAsync(async (req: Request, res: Response) => {
  const data = await adminCustomerService.updateCustomerProfile(String(req.params.customerId), req.body, requestingAdminId(req));
  return successResponse(res, StatusCodes.OK, data);
});

export const triggerCustomerPasswordResetController = catchAsync(async (req: Request, res: Response) => {
  const reset = await adminCustomerService.createCustomerPasswordReset(String(req.params.customerId), requestingAdminId(req));
  const { html, subject } = customerPasswordResetMessage(
    [reset.user.firstName, reset.user.lastName].filter(Boolean).join(" ") || "there",
    customerResetUrl(reset.token),
  );
  let sent = true;
  try {
    await sendEmail(reset.user.email, subject, html);
  } catch (error) {
    sent = false;
    console.error("Customer password reset email failed:", error);
  }
  return successResponse(res, StatusCodes.OK, { sent, expiresAt: reset.expiresAt });
});

export const suspendCustomerController = catchAsync(async (req: Request, res: Response) => {
  const data = await adminCustomerService.suspendCustomer(String(req.params.customerId), req.body, requestingAdminId(req));
  return successResponse(res, StatusCodes.OK, data);
});

export const reactivateCustomerController = catchAsync(async (req: Request, res: Response) => {
  const data = await adminCustomerService.reactivateCustomer(String(req.params.customerId), req.body.reason, requestingAdminId(req));
  return successResponse(res, StatusCodes.OK, data);
});

export const adjustCustomerWalletController = catchAsync(async (req: Request, res: Response) => {
  const data = await adminCustomerService.adjustCustomerWallet(String(req.params.customerId), req.body, requestingAdminId(req));
  return successResponse(res, StatusCodes.OK, data);
});

export const customerAuditHistoryController = catchAsync(async (req: Request, res: Response) => {
  const data = await adminCustomerService.fetchCustomerAuditHistory(String(req.params.customerId), req.query);
  return successResponse(res, StatusCodes.OK, data);
});

export const sendCustomerMessageController = catchAsync(async (req: Request, res: Response) => {
  const user = await adminCustomerService.logCustomerMessage(String(req.params.customerId), req.body.subject, requestingAdminId(req));
  await notificationService.createNotification({
    userId: user._id,
    title: req.body.subject,
    message: req.body.message,
    type: NotificationTypeEnum.info,
  });
  const { html, subject } = adminCustomerMessage(
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "there",
    req.body.subject,
    req.body.message,
  );
  let emailSent = true;
  try {
    await sendEmail(user.email, subject, html);
  } catch (error) {
    emailSent = false;
    console.error("Admin customer message email failed:", error);
  }
  return successResponse(res, StatusCodes.CREATED, { sent: true, emailSent });
});
