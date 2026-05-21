"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdminsController = exports.resetPasswordController = exports.forgetPasswordController = exports.changeStatusAdmin = exports.loginAdminController = exports.createAdminController = exports.fetchAllVerificationsController = exports.fetchUserSubscriptionsController = exports.fetchUserAccountDetailsController = exports.fetchAllCategoriesController = exports.fetchSingleCategoryController = exports.deleteCategoryController = exports.addCategoriesController = exports.updateJobPaymentStatusController = exports.fetchPrivateExpertByIdController = exports.fetchAllPrivateExpertsController = exports.updateVatController = exports.fetchSingleTransactionAdminController = exports.fetchAllTransactionsAdminController = exports.fetchSubscriptionsController = exports.fetchSingleMaterialController = exports.fetchAllMaterialsAdminController = exports.createJobAdminController = exports.fetchSingleJobAdminController = exports.fetchJobsAdminController = exports.addUserAdminController = exports.fetchUserDetails = exports.suspendUserAdminController = exports.verifyUserAdminController = exports.fetchAllUsersAdminController = exports.adminDashboardController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const productService = __importStar(require("../services/product.service"));
const http_status_codes_1 = require("http-status-codes");
const error_1 = require("../errors/error");
const subscriptionService = __importStar(require("../services/subscription.service"));
const userService = __importStar(require("../services/auth.service"));
const jobService = __importStar(require("../services/job.service"));
const privateExpertService = __importStar(require("../services/private-expert.service"));
const transactionService = __importStar(require("../services/transaction.service"));
const transaction_enum_1 = require("../enums/transaction.enum");
const planService = __importStar(require("../services/plan.service"));
const user_enums_1 = require("../enums/user.enums");
const businessService = __importStar(require("../services/business.service"));
const projectService = __importStar(require("../services/project.service"));
const authService = __importStar(require("../services/auth.service"));
const walletService = __importStar(require("../services/wallet.services"));
const plan_enum_1 = require("../enums/plan.enum");
const send_email_1 = require("../utils/send_email");
const templates_1 = require("../utils/templates");
const utility_1 = require("../utils/utility");
const mongoose_1 = __importDefault(require("mongoose"));
const jobs_enum_1 = require("../enums/jobs.enum");
const project_enum_1 = require("../enums/project.enum");
const verificationService = __importStar(require("../services/verification.service"));
const order_enum_1 = require("../enums/order.enum");
const adminService = __importStar(require("../services/admin.service"));
const hashing_1 = require("../utils/hashing");
const jwt_1 = require("../utils/jwt");
exports.adminDashboardController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { currency, year } = req.query;
    const data = {
        totalProducts: await productService.fetchAllProductsForAdmin(),
        totalUsers: await userService.fetchAllUsersAdminDashboard(),
        totalJobs: await jobService.fetchAllJobsForAdminDashboard(),
        totalPrivateExperts: await privateExpertService.fetchCountPrivateExpertsAdminDashboard(),
        totalTransactions: await transactionService.fetchTransactionChartAdminDashboard(year, currency),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.fetchAllUsersAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page, limit, q, search } = req.query;
    let userData = [];
    const { users, totalUsers } = await userService.fetchAllUsersAdmin(page, limit, q, search);
    for (const user of users) {
        const subcription = await subscriptionService.getSubscriptionById(String(user.subscription));
        const plan = await planService.getPlanById(String(subcription.planId));
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
        });
    }
    ;
    const data = {
        users: userData,
        totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.verifyUserAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { verificationId } = req.query;
    const verification = await verificationService.findById(verificationId);
    if (!verification) {
        throw new error_1.NotFoundError("Verification not found");
    }
    if (verification.paymentStatus !== order_enum_1.OrderPaymentStatus.paid) {
        throw new error_1.BadRequestError("You cannot complete this verification as it has not been paid");
    }
    if (verification.type === user_enums_1.VerificationEnum.user) {
        await userService.verifyUser(String(verification.userId));
        verification.status = jobs_enum_1.QuoteStatusEnum.accepted;
        await verification.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'User verified successfully');
    }
    else if (verification.type === user_enums_1.VerificationEnum.business) {
        await businessService.verifyBusinessAdmin(String(verification.businessId));
        verification.status = jobs_enum_1.QuoteStatusEnum.accepted;
        await verification.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'Business verified successfully');
    }
    else if (verification.type === user_enums_1.VerificationEnum.certificate) {
        const { message, certificate } = await businessService.verifyCertificateAdmin(String(verification.businessId), String(verification.certificateId));
        verification.status = jobs_enum_1.QuoteStatusEnum.accepted;
        await verification.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, message);
    }
});
exports.suspendUserAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const user = await userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    if (user.status === user_enums_1.UserStatus.suspended) {
        user.status = user_enums_1.UserStatus.active;
    }
    else {
        user.status = user_enums_1.UserStatus.suspended;
    }
    await user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'User suspended successfully');
});
exports.fetchUserDetails = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const { q } = req.query;
    const user = await userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    let data = {
        profileImage: user.profileImage,
        name: user.fullName,
        level: user.level,
        uniqueId: user.uniqueId,
        fullName: user.fullName,
        status: user.status,
        accountDetails: user.accountDetails,
    };
    if (q === "userDetails") {
        const payload = {
            email: user.email,
            userName: user.userName,
            phoneNumber: [user.number1, user.number2],
            whatsappNumber: user.whatsAppNo,
            bio: user.bio,
            languages: user.language,
            location: user.location,
        };
        data = { ...data, ...payload };
    }
    else if (q === "services") {
        const business = await businessService.fetchAllUserBusinessesAdmin(String(user._id));
        const payload = {
            businesses: business,
        };
        data = { ...data, ...payload };
    }
    else if (q === "jobs") {
        const jobs = await jobService.fetchAllUserJobsAdmin(String(user._id));
        const payload = {
            jobs,
        };
        data = { ...data, ...payload };
    }
    else if (q === "projects") {
        const projects = await projectService.fetchAllUserProjectsAdmin(String(user._id));
        const payload = {
            projects,
        };
        data = { ...data, ...payload };
    }
    else if (q === "materials") {
        const materials = await productService.fetchAllUserProductsAdmin(String(user._id));
        const payload = {
            materials,
        };
        data = { ...data, ...payload };
    }
    else if (q === "subscriptions") {
        const subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(String(user._id));
        const subscriptionTransactions = await transactionService.fetchTransactionsByService(String(user._id), transaction_enum_1.ServiceEnum.subscription);
        const plan = await planService.getPlanById(String(subscription.planId));
        console.log(plan);
        const payload = {
            subscription,
            name: plan.name,
            price: plan.price,
            subscriptionTransactions,
        };
        data = { ...data, ...payload };
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.addUserAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userName, email, } = req.body;
    const isEmailExists = await authService.findUserByEmail(email);
    if (isEmailExists)
        throw new error_1.BadRequestError("User with email already exists!");
    const isUserNameExists = await authService.findUserByUserName(userName);
    if (isUserNameExists)
        throw new error_1.BadRequestError("UserName already exists!");
    const user = {
        email: email.toLowerCase(),
        uniqueId: (0, utility_1.generateShortUUID)()
    };
    const data = await authService.createUser(user);
    await data.save();
    const walletPayload = {
        userId: data._id,
        isDefault: true
    };
    const wallet = await walletService.createWallet(walletPayload);
    data.wallets.push(wallet._id);
    await data.save();
    const plan = await planService.getPlanByName(plan_enum_1.PlanEnum.basic);
    if (!plan)
        throw new error_1.NotFoundError("Plan not found!");
    const subscription = await subscriptionService.createSubscription({ userId: data._id, planId: plan._id, startDate: new Date(), perks: plan.perks });
    data.subscription = subscription._id;
    await data.save();
    const { html, subject } = (0, templates_1.welcomeMessageAdmin)(userName);
    (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.fetchJobsAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { status, page = 1, limit = 10, search } = req.query;
    let allJobs = [];
    const { totalJobs, jobs } = await jobService.fetchAllJobsAdmin(status, page, limit, search);
    for (const job of jobs) {
        const user = await userService.findUserById(job.userId);
        allJobs.push({
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
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSingleJobAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { jobId } = req.params;
    const data = await jobService.fetchJobByIdWithDetails(jobId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.createJobAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const job = req.body;
    const files = req.files;
    if (files && files.length > 0) {
        const fileObjects = files.map((file) => ({
            id: new mongoose_1.default.Types.ObjectId(),
            url: file.path,
        }));
        job.jobFiles = fileObjects;
    }
    let user;
    if (!req.body.identifier) {
        throw new error_1.BadRequestError('uniqueId, user ID or email is required!');
    }
    user = await authService.findUserUsingUniqueIdEmailUserId(req.body.identifier);
    if (!user)
        throw new error_1.NotFoundError("User not found!");
    if (job.type == jobs_enum_1.JobType.direct && (job.email || job.userName)) {
        const userId = user.id;
        job.userId = userId;
        const data = await jobService.createJob(job);
        const payload = {
            job: data._id,
            user: user._id,
            creator: userId,
            directJobStatus: project_enum_1.ProjectStatusEnum.pending,
        };
        const project = await projectService.createProject(payload);
        data.applications = [];
        data.applications.push(String(project._id));
        data.acceptedApplicationId = String(project._id);
        data.save();
        const { html, subject } = (0, templates_1.directJobApplicationMessage)(user.userName, req.user.userName, String(data._id));
        await (0, send_email_1.sendEmail)(user.email, subject, html);
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else {
        job.userId = String(user._id);
        const data = await jobService.createJob(job);
        (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
});
exports.fetchAllMaterialsAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { q, page = 1, limit = 10, search } = req.query;
    let products;
    const { materials, totalMaterials } = await productService.fetchAllProductsAdmin(page, limit, search);
    if (q == 'inStock') {
        products = materials.filter((material) => material.availableQuantity > 0);
    }
    else if (q == 'outOfStock') {
        products = materials.filter((material) => material.availableQuantity <= 0);
    }
    else {
        products = materials;
    }
    const data = {
        materials: products,
        totalMaterials,
        page,
        totalPages: Math.ceil(totalMaterials / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSingleMaterialController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { materialId } = req.params;
    const data = await productService.fetchProductByIdWithDetails(materialId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSubscriptionsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { limit = 10, page = 1, search = "", status } = req.query;
    const { subscriptions, totalSubscriptions, totalBasic, totalSilver, totalGold, totalPlatinum, } = await subscriptionService.fetchAllSubscriptionsAdmin(Number(limit), Number(page), search, status);
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
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllTransactionsAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { limit, page, search } = req.query;
    const { transactions, totalTransactions } = await transactionService.fetchAllTransactionsAdmin(limit, page, search);
    const data = {
        transactions,
        totalTransactions,
        page,
        totalPages: Math.ceil(totalTransactions / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSingleTransactionAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { transactionId } = req.params;
    const data = await transactionService.fetchTransactionAdmin(transactionId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.updateVatController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { vat } = req.body;
    const data = await transactionService.changeVatServiceAdmin(vat);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllPrivateExpertsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const experts = await privateExpertService.fetchAllPrivateExpertsAdminDashboard(page, limit);
    const totalExperts = await privateExpertService.fetchCountPrivateExpertsAdminDashboard();
    const totalLikedExperts = experts.length;
    const data = {
        experts,
        totalPages: Math.ceil(totalLikedExperts / limit),
        totalExperts,
        page,
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchPrivateExpertByIdController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const data = await privateExpertService.fetchPrivateExpertById(String(id));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.updateJobPaymentStatusController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { jobId } = req.params;
    const { status, milestoneId } = req.body;
    if (!jobId && !milestoneId) {
        throw new error_1.NotFoundError("Ids required!");
    }
    ;
    const job = await jobService.fetchJobById(String(jobId));
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    const milestone = job.milestones.find((milestone) => String(milestone._id) === milestoneId);
    if (!milestone) {
        throw new error_1.NotFoundError("Milestone not found within this job!");
    }
    milestone.paymentStatus = status;
    if (status === jobs_enum_1.MilestonePaymentStatus.paid) {
        milestone.datePaid = new Date();
        milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.paid;
        const transaction = await transactionService.fetchSingleTransactionByMilestoneId(String(milestone._id));
        if (!transaction) {
            throw new error_1.NotFoundError('Transaction not found!');
        }
        transaction.status = transaction_enum_1.TransactionEnum.completed;
        transaction.isSettled = true;
        await transaction.save();
    }
    await job.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, job);
});
exports.addCategoriesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { category } = req.body;
    const payload = {
        category,
    };
    const data = await productService.createCategory(payload);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.deleteCategoryController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    await productService.deleteCategory(String(id));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Category deleted successfully");
});
exports.fetchSingleCategoryController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const data = await productService.fetchSingleCategory(String(id));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllCategoriesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await productService.fetchAllCategories();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchUserAccountDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const user = await userService.findUserById(String(userId));
    if (!user) {
        throw new error_1.NotFoundError("user not found");
    }
    const data = {
        accountNumber: user?.accountDetails.number,
        bank: user?.accountDetails.bank,
        holderName: user?.accountDetails.holdersName
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchUserSubscriptionsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { limit, page } = req.query;
    const { userId } = req.params;
    const { subscriptions, totalSubscriptions } = await subscriptionService.fetchAllUserSubscriptionsAdmin(limit, page, userId);
    const data = {
        subscriptions,
        totalSubscriptions,
        page: Number(page),
        totalPages: Math.ceil(totalSubscriptions / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllVerificationsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { limit, page } = req.query;
    const data = await verificationService.fetchAllVerifications(page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.createAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { fullName, mobile, email, password } = req.body;
    const isEmailExists = await adminService.getAdminByEmail(email.toLowerCase());
    if (isEmailExists) {
        throw new error_1.BadRequestError('Email exists');
    }
    const encryptPwd = await (0, hashing_1.hashPassword)(password);
    const data = await adminService.createAdmin({
        fullName,
        mobile,
        email: email.toLowerCase(),
        password: encryptPwd
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, "Admin created");
});
exports.loginAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const foundUser = await adminService.getAdminByEmail(email.toLowerCase());
    if (!foundUser)
        throw new error_1.NotFoundError("Invalid credentials!");
    const userPwd = foundUser.password;
    const pwdCompare = await (0, hashing_1.comparePassword)(password, userPwd);
    if (!pwdCompare)
        throw new error_1.NotFoundError("Invalid credentials!");
    if (foundUser.status == user_enums_1.UserStatus.deactivated) {
        throw new error_1.UnauthorizedError("Account Deactivated!!");
    }
    if (foundUser.status == user_enums_1.UserStatus.suspended) {
        throw new error_1.UnauthorizedError("Account Suspended kindly Contact Admin!!");
    }
    //   if(foundUser.isEmailVerified == false){
    //     throw new BadRequestError("Kindly verify your email!");
    //   }
    const token = await (0, jwt_1.generateJWTwithExpiryDate)({
        email: foundUser.email,
        id: foundUser._id,
    });
    const userData = await authService.findUserById(String(foundUser._id));
    const user = {
        token,
        userData
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
});
exports.changeStatusAdmin = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { status, id } = req.body;
    const admin = await adminService.getAdminById(id);
    if (!admin) {
        throw new error_1.NotFoundError('Admin not found');
    }
    admin.status = status;
    await admin.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Admin status changed");
});
exports.forgetPasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    const foundUser = await adminService.getAdminByEmail(email.toLowerCase());
    if (!foundUser)
        throw new error_1.NotFoundError("Admin not found!");
    const { otp, otpExpiryTime } = await (0, utility_1.generateOTPData)(String(foundUser._id));
    foundUser.otpExpiresAt = otpExpiryTime;
    foundUser.passwordResetOtp = otp;
    await foundUser.save();
    const { html, subject } = (0, templates_1.passwordResetMessage)(String(foundUser.fullName), otp);
    await (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset OTP sent to your email.");
});
exports.resetPasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const foundUser = await adminService.getAdminByEmail(email.toLowerCase());
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    if (foundUser.passwordResetOtp !== otp)
        throw new error_1.BadRequestError("Invalid OTP");
    const expiresAt = foundUser.otpExpiresAt;
    if (foundUser.otpExpiresAt && Date.now() > expiresAt) {
        throw new error_1.BadRequestError("OTP expired, request a new one.");
    }
    const hashedPassword = await (0, hashing_1.hashPassword)(newPassword);
    foundUser.password = hashedPassword;
    foundUser.passwordResetOtp = undefined;
    foundUser.otpExpiresAt = undefined;
    if (foundUser.isEmailVerified == false) {
        foundUser.isEmailVerified = true;
    }
    await foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset successfully!");
});
exports.fetchAdminsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const { admins, totalAdmins } = await adminService.fetchAllAdmins(Number(page), Number(limit), String(search));
    const data = {
        admins,
        totalAdmins,
        page,
        totalPages: Math.ceil(totalAdmins / Number(limit)),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
