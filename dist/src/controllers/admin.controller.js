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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeStatusAdmin = exports.loginAdminController = exports.createAdminController = exports.fetchAllVerificationsController = exports.fetchUserSubscriptionsController = exports.fetchUserAccountDetailsController = exports.fetchAllCategoriesController = exports.fetchSingleCategoryController = exports.deleteCategoryController = exports.addCategoriesController = exports.updateJobPaymentStatusController = exports.fetchPrivateExpertByIdController = exports.fetchAllPrivateExpertsController = exports.updateVatController = exports.fetchSingleTransactionAdminController = exports.fetchAllTransactionsAdminController = exports.fetchSubscriptionsController = exports.fetchSingleMaterialController = exports.fetchAllMaterialsAdminController = exports.createJobAdminController = exports.fetchSingleJobAdminController = exports.fetchJobsAdminController = exports.addUserAdminController = exports.fetchUserDetails = exports.suspendUserAdminController = exports.verifyUserAdminController = exports.fetchAllUsersAdminController = exports.adminDashboardController = void 0;
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
exports.adminDashboardController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currency, year } = req.query;
    const data = {
        totalProducts: yield productService.fetchAllProductsForAdmin(),
        totalUsers: yield userService.fetchAllUsersAdminDashboard(),
        totalJobs: yield jobService.fetchAllJobsForAdminDashboard(),
        totalPrivateExperts: yield privateExpertService.fetchCountPrivateExpertsAdminDashboard(),
        totalTransactions: yield transactionService.fetchTransactionChartAdminDashboard(year, currency),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.fetchAllUsersAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, q, search } = req.query;
    let userData = [];
    const { users, totalUsers } = yield userService.fetchAllUsersAdmin(page, limit, q, search);
    for (const user of users) {
        const subcription = yield subscriptionService.getSubscriptionById(String(user.subscription));
        const plan = yield planService.getPlanById(String(subcription.planId));
        const transactions = yield transactionService.fetchAllUserEarningsAdmin(String(user._id));
        userData.push({
            userName: user.userName,
            userId: user._id,
            name: user.fullName,
            email: user.email,
            status: user.status,
            subscription: (plan === null || plan === void 0 ? void 0 : plan.name) || null,
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
}));
exports.verifyUserAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { verificationId } = req.query;
    const verification = yield verificationService.findById(verificationId);
    if (!verification) {
        throw new error_1.NotFoundError("Verification not found");
    }
    if (verification.paymentStatus !== order_enum_1.OrderPaymentStatus.paid) {
        throw new error_1.BadRequestError("You cannot complete this verification as it has not been paid");
    }
    if (verification.type === user_enums_1.VerificationEnum.user) {
        yield userService.verifyUser(String(verification.userId));
        verification.status = jobs_enum_1.QuoteStatusEnum.accepted;
        yield verification.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'User verified successfully');
    }
    else if (verification.type === user_enums_1.VerificationEnum.business) {
        yield businessService.verifyBusinessAdmin(String(verification.businessId));
        verification.status = jobs_enum_1.QuoteStatusEnum.accepted;
        yield verification.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'Business verified successfully');
    }
    else if (verification.type === user_enums_1.VerificationEnum.certificate) {
        const { message, certificate } = yield businessService.verifyCertificateAdmin(String(verification.businessId), String(verification.certificateId));
        verification.status = jobs_enum_1.QuoteStatusEnum.accepted;
        yield verification.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, message);
    }
}));
exports.suspendUserAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const user = yield userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    if (user.status === user_enums_1.UserStatus.suspended) {
        user.status = user_enums_1.UserStatus.active;
    }
    else {
        user.status = user_enums_1.UserStatus.suspended;
    }
    yield user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'User suspended successfully');
}));
exports.fetchUserDetails = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { q } = req.query;
    const user = yield userService.findUserById(userId);
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
        data = Object.assign(Object.assign({}, data), payload);
    }
    else if (q === "services") {
        const business = yield businessService.fetchAllUserBusinessesAdmin(String(user._id));
        const payload = {
            businesses: business,
        };
        data = Object.assign(Object.assign({}, data), payload);
    }
    else if (q === "jobs") {
        const jobs = yield jobService.fetchAllUserJobsAdmin(String(user._id));
        const payload = {
            jobs,
        };
        data = Object.assign(Object.assign({}, data), payload);
    }
    else if (q === "projects") {
        const projects = yield projectService.fetchAllUserProjectsAdmin(String(user._id));
        const payload = {
            projects,
        };
        data = Object.assign(Object.assign({}, data), payload);
    }
    else if (q === "materials") {
        const materials = yield productService.fetchAllUserProductsAdmin(String(user._id));
        const payload = {
            materials,
        };
        data = Object.assign(Object.assign({}, data), payload);
    }
    else if (q === "subscriptions") {
        const subscription = yield subscriptionService.getActiveSubscriptionWithoutDetails(String(user._id));
        const subscriptionTransactions = yield transactionService.fetchTransactionsByService(String(user._id), transaction_enum_1.ServiceEnum.subscription);
        const plan = yield planService.getPlanById(String(subscription.planId));
        console.log(plan);
        const payload = {
            subscription,
            name: plan.name,
            price: plan.price,
            subscriptionTransactions,
        };
        data = Object.assign(Object.assign({}, data), payload);
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.addUserAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userName, email, } = req.body;
    const isEmailExists = yield authService.findUserByEmail(email);
    if (isEmailExists)
        throw new error_1.BadRequestError("User with email already exists!");
    const isUserNameExists = yield authService.findUserByUserName(userName);
    if (isUserNameExists)
        throw new error_1.BadRequestError("UserName already exists!");
    const user = {
        userName,
        email: email.toLowerCase(),
        uniqueId: (0, utility_1.generateShortUUID)()
    };
    const data = yield authService.createUser(user);
    yield data.save();
    const walletPayload = {
        userId: data._id,
        isDefault: true
    };
    const wallet = yield walletService.createWallet(walletPayload);
    data.wallets.push(wallet._id);
    yield data.save();
    const plan = yield planService.getPlanByName(plan_enum_1.PlanEnum.basic);
    if (!plan)
        throw new error_1.NotFoundError("Plan not found!");
    const subscription = yield subscriptionService.createSubscription({ userId: data._id, planId: plan._id, startDate: new Date(), perks: plan.perks });
    data.subscription = subscription._id;
    yield data.save();
    const { html, subject } = (0, templates_1.welcomeMessageAdmin)(userName);
    (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.fetchJobsAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, page = 1, limit = 10, search } = req.query;
    let allJobs = [];
    const { totalJobs, jobs } = yield jobService.fetchAllJobsAdmin(status, page, limit, search);
    for (const job of jobs) {
        const user = yield userService.findUserById(job.userId);
        allJobs.push({
            jobId: job._id,
            title: job.title,
            poster: user === null || user === void 0 ? void 0 : user.fullName,
            userName: user === null || user === void 0 ? void 0 : user.userName,
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
}));
exports.fetchSingleJobAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const data = yield jobService.fetchJobByIdWithDetails(jobId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.createJobAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    user = yield authService.findUserUsingUniqueIdEmailUserId(req.body.identifier);
    if (!user)
        throw new error_1.NotFoundError("User not found!");
    if (job.type == jobs_enum_1.JobType.direct && (job.email || job.userName)) {
        const userId = user.id;
        job.userId = userId;
        const data = yield jobService.createJob(job);
        const payload = {
            job: data._id,
            user: user._id,
            creator: userId,
            directJobStatus: project_enum_1.ProjectStatusEnum.pending,
        };
        const project = yield projectService.createProject(payload);
        data.applications = [];
        data.applications.push(String(project._id));
        data.acceptedApplicationId = String(project._id);
        data.save();
        const { html, subject } = (0, templates_1.directJobApplicationMessage)(user.userName, req.user.userName, String(data._id));
        yield (0, send_email_1.sendEmail)(user.email, subject, html);
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else {
        job.userId = String(user._id);
        const data = yield jobService.createJob(job);
        (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
}));
exports.fetchAllMaterialsAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q, page = 1, limit = 10, search } = req.query;
    let products;
    const { materials, totalMaterials } = yield productService.fetchAllProductsAdmin(page, limit, search);
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
}));
exports.fetchSingleMaterialController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId } = req.params;
    const data = yield productService.fetchProductByIdWithDetails(materialId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchSubscriptionsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page } = req.query;
    const { subscriptions, totalSubscriptions } = yield subscriptionService.fetchAllSubscriptionsAdmin(limit, page);
    const data = {
        subscriptions,
        totalSubscriptions,
        page,
        totalPages: Math.ceil(totalSubscriptions / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchAllTransactionsAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, search } = req.query;
    const { transactions, totalTransactions } = yield transactionService.fetchAllTransactionsAdmin(limit, page, search);
    const data = {
        transactions,
        totalTransactions,
        page,
        totalPages: Math.ceil(totalTransactions / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchSingleTransactionAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transactionId } = req.params;
    const data = yield transactionService.fetchTransactionAdmin(transactionId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.updateVatController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vat } = req.body;
    const data = yield transactionService.changeVatServiceAdmin(vat);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchAllPrivateExpertsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
    const experts = yield privateExpertService.fetchAllPrivateExpertsAdminDashboard(page, limit);
    const totalExperts = yield privateExpertService.fetchCountPrivateExpertsAdminDashboard();
    const totalLikedExperts = experts.length;
    const data = {
        experts,
        totalPages: Math.ceil(totalLikedExperts / limit),
        totalExperts,
        page,
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchPrivateExpertByIdController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = yield privateExpertService.fetchPrivateExpertById(id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.updateJobPaymentStatusController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const { status, milestoneId } = req.body;
    if (!jobId && !milestoneId) {
        throw new error_1.NotFoundError("Ids required!");
    }
    ;
    const job = yield jobService.fetchJobById(String(jobId));
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
        const transaction = yield transactionService.fetchSingleTransactionByMilestoneId(String(milestone._id));
        if (!transaction) {
            throw new error_1.NotFoundError('Transaction not found!');
        }
        transaction.status = transaction_enum_1.TransactionEnum.completed;
        transaction.isSettled = true;
        yield transaction.save();
    }
    yield job.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, job);
}));
exports.addCategoriesController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category } = req.body;
    const payload = {
        category,
    };
    const data = yield productService.createCategory(payload);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.deleteCategoryController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield productService.deleteCategory(id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Category deleted successfully");
}));
exports.fetchSingleCategoryController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = yield productService.fetchSingleCategory(id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchAllCategoriesController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield productService.fetchAllCategories();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchUserAccountDetailsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const user = yield userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("user not found");
    }
    const data = {
        accountNumber: user === null || user === void 0 ? void 0 : user.accountDetails.number,
        bank: user === null || user === void 0 ? void 0 : user.accountDetails.bank,
        holderName: user === null || user === void 0 ? void 0 : user.accountDetails.holdersName
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchUserSubscriptionsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page } = req.query;
    const { userId } = req.params;
    const { subscriptions, totalSubscriptions } = yield subscriptionService.fetchAllUserSubscriptionsAdmin(limit, page, userId);
    const data = {
        subscriptions,
        totalSubscriptions,
        page: Number(page),
        totalPages: Math.ceil(totalSubscriptions / limit),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchAllVerificationsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page } = req.query;
    const data = yield verificationService.fetchAllVerifications(page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.createAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullName, mobile, email, password } = req.body;
    const isEmailExists = yield adminService.getAdminByEmail(email.toLowerCase());
    if (isEmailExists) {
        throw new error_1.BadRequestError('Email exists');
    }
    const encryptPwd = yield (0, hashing_1.hashPassword)(password);
    const data = yield adminService.createAdmin({
        fullName,
        mobile,
        email: email.toLowerCase(),
        password: encryptPwd
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, "Admin created");
}));
exports.loginAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const foundUser = yield adminService.getAdminByEmail(email.toLowerCase());
    if (!foundUser)
        throw new error_1.NotFoundError("Invalid credentials!");
    const userPwd = foundUser.password;
    const pwdCompare = yield (0, hashing_1.comparePassword)(password, userPwd);
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
    const token = yield (0, jwt_1.generateJWTwithExpiryDate)({
        email: foundUser.email,
        id: foundUser._id,
        userName: foundUser.fullName
    });
    const userData = yield authService.findUserById(String(foundUser._id));
    const user = {
        token,
        userData
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
}));
exports.changeStatusAdmin = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, id } = req.body;
    const admin = yield adminService.getAdminById(id);
    if (!admin) {
        throw new error_1.NotFoundError('Admin not found');
    }
    admin.status = status;
    yield admin.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Admin status changed");
}));
