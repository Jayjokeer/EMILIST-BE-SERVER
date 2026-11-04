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
exports.addCategoriesController = exports.updateJobPaymentStatusController = exports.fetchPrivateExpertByIdController = exports.fetchAllPrivateExpertsController = exports.declineWithdrawalController = exports.approveWithdrawalController = exports.updateVatController = exports.fetchSingleTransactionAdminController = exports.fetchAllTransactionsAdminController = exports.fetchSubscriptionsController = exports.fetchSingleMaterialController = exports.fetchAllMaterialsAdminController = exports.createJobAdminController = exports.fetchSingleJobAdminController = exports.fetchJobsAdminController = exports.addUserAdminController = exports.fetchUserDetails = exports.suspendUserAdminController = exports.verifyUserAdminController = exports.fetchAllUsersAdminController = exports.declineAdminWithdrawalController = exports.approveAdminWithdrawalController = exports.adminWithdrawalsController = exports.downloadAdminPaymentPdfController = exports.adminPaymentDetailsController = exports.adminPaymentsController = exports.adminPaymentSummaryController = exports.initiateAdminMaterialOrderReturnController = exports.adminMaterialOrderDetailsController = exports.adminMaterialOrdersController = exports.delistAdminMaterialController = exports.adminMaterialProductOrdersController = exports.adminMaterialReviewsController = exports.adminMaterialDetailsController = exports.adminMaterialsController = exports.adminMaterialSummaryController = exports.updateSupportRequestController = exports.supportRequestController = exports.supportRequestsController = exports.adminJobActionController = exports.downloadAdminJobPaymentReceiptController = exports.downloadAdminJobInvoiceController = exports.adminJobPaymentsController = exports.adminJobInvoicesController = exports.adminJobApplicantsController = exports.adminJobDetailsController = exports.adminJobsController = exports.adminJobSummaryController = exports.adminOverviewController = exports.adminDashboardController = void 0;
exports.sendCustomerMessageController = exports.customerAuditHistoryController = exports.adjustCustomerWalletController = exports.reactivateCustomerController = exports.suspendCustomerController = exports.triggerCustomerPasswordResetController = exports.updateCustomerProfileController = exports.createCustomerController = exports.customerSubscriptionsController = exports.customerTransactionsController = exports.customerSalesController = exports.customerOrdersController = exports.customerListingsController = exports.customerJobsController = exports.customerServicesController = exports.customerDetailsController = exports.customerOverviewController = exports.customersController = exports.customerSummaryController = exports.fetchAdminsController = exports.resetPasswordController = exports.verifyAdminPasswordResetMfaController = exports.inspectAdminPasswordResetController = exports.forgetPasswordController = exports.changeStatusAdmin = exports.activateLegacyAdminMfaController = exports.verifyAdminLoginMfaController = exports.loginAdminController = exports.activateAdminAccountController = exports.getAdminAuthenticatorSetupController = exports.setAdminOnboardingPasswordController = exports.inspectAdminInvitationController = exports.createAdminController = exports.fetchAllVerificationsController = exports.fetchUserSubscriptionsController = exports.fetchUserAccountDetailsController = exports.fetchAllCategoriesController = exports.fetchSingleCategoryController = exports.deleteCategoryController = void 0;
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
const notification_enum_1 = require("../enums/notification.enum");
const admin_onboarding_service_1 = require("../services/admin-onboarding.service");
const config_1 = require("../utils/config");
const adminCustomerService = __importStar(require("../services/admin-customer.service"));
const notificationService = __importStar(require("../services/notification.service"));
const adminOverviewService = __importStar(require("../services/admin-overview.service"));
const adminJobService = __importStar(require("../services/admin-job.service"));
const supportRequestService = __importStar(require("../services/support-request.service"));
const adminJobDocumentService = __importStar(require("../services/admin-job-document.service"));
const adminMaterialService = __importStar(require("../services/admin-material.service"));
const adminPaymentService = __importStar(require("../services/admin-payment.service"));
const adminPaymentDocumentService = __importStar(require("../services/admin-payment-document.service"));
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
exports.adminOverviewController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const range = typeof req.query.range === "string" ? req.query.range : undefined;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminOverviewService.fetchAdminOverview(range));
});
exports.adminJobSummaryController = (0, error_handler_1.catchAsync)(async (_req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.fetchAdminJobSummary());
});
exports.adminJobsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.fetchAdminJobs(req.query));
});
exports.adminJobDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.fetchAdminJobDetails(String(req.params.jobId)));
});
exports.adminJobApplicantsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.fetchAdminJobApplicants(String(req.params.jobId), req.query));
});
exports.adminJobInvoicesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.fetchAdminJobInvoices(String(req.params.jobId)));
});
exports.adminJobPaymentsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.fetchAdminJobPayments(String(req.params.jobId)));
});
exports.downloadAdminJobInvoiceController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const buffer = await adminJobDocumentService.buildAdminJobInvoicePdf(String(req.params.jobId), String(req.params.invoiceId));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="job-invoice-${String(req.params.invoiceId).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`);
    return res.status(http_status_codes_1.StatusCodes.OK).send(buffer);
});
exports.downloadAdminJobPaymentReceiptController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const buffer = await adminJobDocumentService.buildAdminJobPaymentReceiptPdf(String(req.params.jobId), String(req.params.paymentId));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="job-payment-${String(req.params.paymentId).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`);
    return res.status(http_status_codes_1.StatusCodes.OK).send(buffer);
});
exports.adminJobActionController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminJobService.applyAdminJobAction(String(req.params.jobId), requestingAdminId(req), req.body));
});
exports.supportRequestsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await supportRequestService.fetchSupportRequests(req.query));
});
exports.supportRequestController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await supportRequestService.fetchSupportRequest(String(req.params.requestId)));
});
exports.updateSupportRequestController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await supportRequestService.updateSupportRequest(String(req.params.requestId), requestingAdminId(req), req.body));
});
exports.adminMaterialSummaryController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const range = typeof req.query.range === "string" ? req.query.range : undefined;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterialSummary(range));
});
exports.adminMaterialsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterials(req.query));
});
exports.adminMaterialDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterialDetails(String(req.params.productId), req.query));
});
exports.adminMaterialReviewsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterialReviews(String(req.params.productId), req.query));
});
exports.adminMaterialProductOrdersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterialOrders(req.query, String(req.params.productId)));
});
exports.delistAdminMaterialController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.delistAdminMaterial(String(req.params.productId), requestingAdminId(req), req.body.reason));
});
exports.adminMaterialOrdersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterialOrders(req.query));
});
exports.adminMaterialOrderDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.fetchAdminMaterialOrderDetails(String(req.params.orderId), req.query));
});
exports.initiateAdminMaterialOrderReturnController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminMaterialService.initiateAdminOrderReturn(String(req.params.orderId), requestingAdminId(req), req.body.reason));
});
exports.adminPaymentSummaryController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const range = typeof req.query.range === "string" ? req.query.range : undefined;
    const currency = typeof req.query.currency === "string" ? req.query.currency : undefined;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminPaymentService.fetchAdminPaymentSummary(range, currency));
});
exports.adminPaymentsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminPaymentService.fetchAdminPayments(req.query));
});
exports.adminPaymentDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminPaymentService.fetchAdminPayment(String(req.params.transactionId)));
});
exports.downloadAdminPaymentPdfController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const transactionId = String(req.params.transactionId);
    const buffer = await adminPaymentDocumentService.buildAdminPaymentPdf(transactionId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="transaction-${transactionId.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`);
    return res.status(http_status_codes_1.StatusCodes.OK).send(buffer);
});
exports.adminWithdrawalsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminPaymentService.fetchAdminWithdrawals(req.query));
});
exports.approveAdminWithdrawalController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminPaymentService.processAdminWithdrawal(String(req.params.transactionId), requestingAdminId(req), "approve", req.body.reason));
});
exports.declineAdminWithdrawalController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminPaymentService.processAdminWithdrawal(String(req.params.transactionId), requestingAdminId(req), "decline", req.body.reason));
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
            name: user.firstName + " " + user.lastName,
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
        profileImage: user.displayImage,
        name: user.firstName + " " + user.lastName,
        level: user.level,
        uniqueId: user.uniqueId,
        fullName: user.firstName + " " + user.lastName,
        status: user.status,
        accountDetails: user.accountDetails,
    };
    if (q === "userDetails") {
        const payload = {
            email: user.email,
            userName: user.userName,
            phoneNumber: user.mobile,
            bio: user.bio,
            languages: user.languages || [],
            location: user.houseAddress,
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
// Withdrawals require manual admin approval before the Paystack transfer goes out
exports.approveWithdrawalController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const transaction = await walletService.approveWithdrawal(req.params.transactionId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        transactionId: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        transferCode: transaction.transferCode || null,
        amount: transaction.amount,
        currency: transaction.currency,
    });
});
exports.declineWithdrawalController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const transaction = await walletService.declineWithdrawal(req.params.transactionId);
    const wallet = await walletService.findWalletById(String(transaction.walletId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        transactionId: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        balance: wallet?.balance ?? null,
    });
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
const adminResponse = (admin) => ({
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
const getValidInvitation = async (token) => {
    const admin = await adminService.getAdminByInvitationToken(token);
    if (!admin)
        throw new error_1.NotFoundError("Invitation is invalid or has already been used");
    if (!admin.invitationExpiresAt || admin.invitationExpiresAt.getTime() <= Date.now()) {
        throw new error_1.BadRequestError("Invitation has expired. Ask a Super Admin to send a new one");
    }
    return admin;
};
exports.createAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { fullName, mobile, email, department, role } = req.body;
    const normalizedEmail = email.toLowerCase();
    const isEmailExists = await adminService.getAdminByEmail(normalizedEmail);
    if (isEmailExists)
        throw new error_1.BadRequestError("An admin with this email already exists");
    const { token, tokenHash } = adminService.createInvitationToken();
    const invitationExpiresAt = new Date(Date.now() + admin_onboarding_service_1.ADMIN_INVITATION_TTL_MS);
    const admin = await adminService.createAdmin({
        fullName,
        mobile,
        email: normalizedEmail,
        department,
        role,
        onboardingStatus: user_enums_1.AdminOnboardingStatus.invited,
        invitationTokenHash: tokenHash,
        invitationExpiresAt,
    });
    const adminFrontendUrl = config_1.config.adminFrontendUrl || config_1.config.frontendLoginUrl || "";
    const separator = adminFrontendUrl.includes("?") ? "&" : "?";
    const invitationUrl = `${adminFrontendUrl}${separator}invite=${encodeURIComponent(token)}`;
    const { html, subject } = (0, templates_1.adminInvitationMessage)(fullName, invitationUrl);
    await (0, send_email_1.sendEmail)(normalizedEmail, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, {
        admin: adminResponse(admin),
        invitationExpiresAt,
    });
});
exports.inspectAdminInvitationController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const admin = await getValidInvitation(String(req.params.token));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        admin: adminResponse(admin),
        nextStep: admin.onboardingStatus === user_enums_1.AdminOnboardingStatus.invited ? "password" : "authenticator",
        invitationExpiresAt: admin.invitationExpiresAt,
    });
});
exports.setAdminOnboardingPasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    const admin = await getValidInvitation(token);
    if (admin.onboardingStatus !== user_enums_1.AdminOnboardingStatus.invited) {
        throw new error_1.BadRequestError("Password has already been created for this invitation");
    }
    (0, admin_onboarding_service_1.assertStrongAdminPassword)(password, confirmPassword);
    await (0, admin_onboarding_service_1.assertPasswordNotReused)(password, admin.password, admin.passwordHistory);
    const enrollment = (0, admin_onboarding_service_1.createAuthenticatorEnrollment)(admin.email);
    admin.password = await (0, hashing_1.hashPassword)(password);
    admin.passwordHistory = [];
    admin.mfaSecret = (0, admin_onboarding_service_1.encryptMfaSecret)(enrollment.secret);
    admin.onboardingStatus = user_enums_1.AdminOnboardingStatus.authenticatorPending;
    admin.invitationAcceptedAt = new Date();
    await admin.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        admin: adminResponse(admin),
        authenticator: {
            secret: enrollment.secret,
            otpauthUri: enrollment.otpauthUri,
            issuer: "Emilist Admin",
            accountName: admin.email,
        },
    });
});
exports.getAdminAuthenticatorSetupController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const admin = await getValidInvitation(req.body.token);
    if (admin.onboardingStatus !== user_enums_1.AdminOnboardingStatus.authenticatorPending || !admin.mfaSecret) {
        throw new error_1.BadRequestError("Create your password before setting up the authenticator");
    }
    const enrollment = (0, admin_onboarding_service_1.createAuthenticatorEnrollment)(admin.email, (0, admin_onboarding_service_1.decryptMfaSecret)(admin.mfaSecret));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        secret: enrollment.secret,
        otpauthUri: enrollment.otpauthUri,
        issuer: "Emilist Admin",
        accountName: admin.email,
    });
});
exports.activateAdminAccountController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { token, code } = req.body;
    const admin = await getValidInvitation(token);
    if (admin.onboardingStatus !== user_enums_1.AdminOnboardingStatus.authenticatorPending || !admin.mfaSecret) {
        throw new error_1.BadRequestError("Authenticator setup is not ready for verification");
    }
    if (!(0, admin_onboarding_service_1.verifyAuthenticatorCode)((0, admin_onboarding_service_1.decryptMfaSecret)(admin.mfaSecret), code)) {
        throw new error_1.BadRequestError("Invalid authenticator code");
    }
    admin.mfaEnabled = true;
    admin.mfaVerifiedAt = new Date();
    admin.isEmailVerified = true;
    admin.onboardingStatus = user_enums_1.AdminOnboardingStatus.active;
    admin.invitationTokenHash = undefined;
    admin.invitationExpiresAt = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();
    const authToken = (0, jwt_1.generateJWTwithExpiryDate)({ email: admin.email, id: admin._id });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { token: authToken, admin: adminResponse(admin) });
});
exports.loginAdminController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const foundUser = await adminService.getAdminForAuthentication(email.toLowerCase());
    if (!foundUser || !foundUser.password)
        throw new error_1.UnauthorizedError("Invalid credentials");
    const userPwd = foundUser.password;
    const pwdCompare = await (0, hashing_1.comparePassword)(password, userPwd);
    if (!pwdCompare)
        throw new error_1.UnauthorizedError("Invalid credentials");
    if (foundUser.status == user_enums_1.UserStatus.deactivated) {
        throw new error_1.UnauthorizedError("Account Deactivated!!");
    }
    if (foundUser.status == user_enums_1.UserStatus.suspended) {
        throw new error_1.UnauthorizedError("Account Suspended kindly Contact Admin!!");
    }
    if (!foundUser.mfaEnabled) {
        if (foundUser.invitationTokenHash)
            throw new error_1.UnauthorizedError("Account onboarding is incomplete");
        const enrollment = (0, admin_onboarding_service_1.createAuthenticatorEnrollment)(foundUser.email, foundUser.mfaSecret ? (0, admin_onboarding_service_1.decryptMfaSecret)(foundUser.mfaSecret) : undefined);
        foundUser.mfaSecret = (0, admin_onboarding_service_1.encryptMfaSecret)(enrollment.secret);
        foundUser.onboardingStatus = user_enums_1.AdminOnboardingStatus.authenticatorPending;
        await foundUser.save();
        const enrollmentToken = (0, jwt_1.generateAdminFlowToken)({
            email: foundUser.email,
            id: String(foundUser._id),
            purpose: "admin_mfa_enrollment",
        }, "15m");
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
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
    if (foundUser.onboardingStatus !== user_enums_1.AdminOnboardingStatus.active) {
        throw new error_1.UnauthorizedError("Account onboarding is incomplete");
    }
    const challengeToken = (0, jwt_1.generateAdminFlowToken)({
        email: foundUser.email,
        id: String(foundUser._id),
        purpose: "admin_mfa_login",
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { mfaRequired: true, challengeToken });
});
exports.verifyAdminLoginMfaController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { challengeToken, code } = req.body;
    const challenge = (0, jwt_1.verifyAdminFlowToken)(challengeToken, "admin_mfa_login");
    const admin = await adminService.getAdminForAuthentication(challenge.email.toLowerCase());
    if (!admin || String(admin._id) !== challenge.id || !admin.mfaEnabled || !admin.mfaSecret) {
        throw new error_1.UnauthorizedError("Invalid sign-in challenge");
    }
    if (admin.status !== user_enums_1.UserStatus.active)
        throw new error_1.UnauthorizedError("Admin account is not active");
    if (!(0, admin_onboarding_service_1.verifyAuthenticatorCode)((0, admin_onboarding_service_1.decryptMfaSecret)(admin.mfaSecret), code)) {
        throw new error_1.BadRequestError("Invalid authenticator code");
    }
    admin.lastLoginAt = new Date();
    await admin.save();
    const token = (0, jwt_1.generateJWTwithExpiryDate)({ email: admin.email, id: admin._id });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { token, admin: adminResponse(admin) });
});
exports.activateLegacyAdminMfaController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { enrollmentToken, code } = req.body;
    const challenge = (0, jwt_1.verifyAdminFlowToken)(enrollmentToken, "admin_mfa_enrollment");
    const admin = await adminService.getAdminForAuthentication(challenge.email.toLowerCase());
    if (!admin || String(admin._id) !== challenge.id || admin.mfaEnabled || !admin.mfaSecret) {
        throw new error_1.UnauthorizedError("Invalid authenticator enrollment challenge");
    }
    if (!(0, admin_onboarding_service_1.verifyAuthenticatorCode)((0, admin_onboarding_service_1.decryptMfaSecret)(admin.mfaSecret), code)) {
        throw new error_1.BadRequestError("Invalid authenticator code");
    }
    admin.mfaEnabled = true;
    admin.mfaVerifiedAt = new Date();
    admin.isEmailVerified = true;
    admin.onboardingStatus = user_enums_1.AdminOnboardingStatus.active;
    admin.lastLoginAt = new Date();
    await admin.save();
    const token = (0, jwt_1.generateJWTwithExpiryDate)({ email: admin.email, id: admin._id });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { token, admin: adminResponse(admin) });
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
    const normalizedEmail = email.toLowerCase();
    const admin = await adminService.getAdminForAuthentication(normalizedEmail);
    if (admin && admin.status === user_enums_1.UserStatus.active && admin.mfaEnabled && admin.mfaSecret) {
        const { token, tokenHash } = adminService.createPasswordResetToken();
        admin.passwordResetTokenHash = tokenHash;
        admin.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        admin.passwordResetAuthorizationHash = undefined;
        admin.passwordResetAuthorizationExpiresAt = undefined;
        admin.passwordResetOtp = undefined;
        admin.otpExpiresAt = undefined;
        await admin.save();
        const adminFrontendUrl = config_1.config.adminFrontendUrl || config_1.config.frontendLoginUrl || "";
        const resetUrl = `${adminFrontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
        const { html, subject } = (0, templates_1.passwordResetMessage)(String(admin.fullName || "Admin"), resetUrl);
        try {
            await (0, send_email_1.sendEmail)(normalizedEmail, subject, html);
        }
        catch (error) {
            // Preserve the same public response for existing and non-existing accounts.
            console.error("Admin password reset email failed:", error);
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: `If an admin account exists for ${normalizedEmail}, a reset link is on its way.`,
        expiresInMinutes: 30,
    });
});
const getValidPasswordReset = async (token) => {
    const admin = await adminService.getAdminByPasswordResetToken(token);
    if (!admin || !admin.passwordResetExpiresAt || admin.passwordResetExpiresAt.getTime() <= Date.now()) {
        throw new error_1.BadRequestError("This reset link is invalid or has expired");
    }
    if (admin.status !== user_enums_1.UserStatus.active || !admin.mfaEnabled || !admin.mfaSecret) {
        throw new error_1.UnauthorizedError("This account cannot be reset using this link");
    }
    return admin;
};
exports.inspectAdminPasswordResetController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const admin = await getValidPasswordReset(String(req.params.token));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        admin: adminResponse(admin),
        nextStep: "authenticator",
        expiresAt: admin.passwordResetExpiresAt,
    });
});
exports.verifyAdminPasswordResetMfaController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { token, code } = req.body;
    const admin = await getValidPasswordReset(token);
    if (!(0, admin_onboarding_service_1.verifyAuthenticatorCode)((0, admin_onboarding_service_1.decryptMfaSecret)(admin.mfaSecret), code)) {
        throw new error_1.BadRequestError("Invalid authenticator code");
    }
    const authorization = adminService.createPasswordResetToken();
    admin.passwordResetTokenHash = undefined;
    admin.passwordResetExpiresAt = undefined;
    admin.passwordResetAuthorizationHash = authorization.tokenHash;
    admin.passwordResetAuthorizationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        authorizationToken: authorization.token,
        expiresInMinutes: 10,
        admin: adminResponse(admin),
    });
});
exports.resetPasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { authorizationToken, password, confirmPassword } = req.body;
    const foundUser = await adminService.getAdminByPasswordResetAuthorization(authorizationToken);
    if (!foundUser ||
        !foundUser.passwordResetAuthorizationExpiresAt ||
        foundUser.passwordResetAuthorizationExpiresAt.getTime() <= Date.now()) {
        throw new error_1.BadRequestError("Password reset authorization is invalid or has expired");
    }
    (0, admin_onboarding_service_1.assertStrongAdminPassword)(password, confirmPassword);
    await (0, admin_onboarding_service_1.assertPasswordNotReused)(password, foundUser.password, foundUser.passwordHistory);
    const previousPassword = foundUser.password;
    const hashedPassword = await (0, hashing_1.hashPassword)(password);
    foundUser.password = hashedPassword;
    foundUser.passwordHistory = previousPassword
        ? [previousPassword, ...(foundUser.passwordHistory || [])].slice(0, admin_onboarding_service_1.PASSWORD_HISTORY_LIMIT)
        : foundUser.passwordHistory;
    foundUser.passwordResetOtp = undefined;
    foundUser.otpExpiresAt = undefined;
    foundUser.passwordResetTokenHash = undefined;
    foundUser.passwordResetExpiresAt = undefined;
    foundUser.passwordResetAuthorizationHash = undefined;
    foundUser.passwordResetAuthorizationExpiresAt = undefined;
    await foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset successfully");
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
const requestingAdminId = (req) => String(req.user?._id || req.user?.id);
const customerResetUrl = (token) => {
    const frontendUrl = config_1.config.customerFrontendUrl || config_1.config.frontendLoginUrl || "";
    return `${frontendUrl.replace(/\/$/, "")}/reset-password?adminToken=${encodeURIComponent(token)}`;
};
exports.customerSummaryController = (0, error_handler_1.catchAsync)(async (_req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerSummary());
});
exports.customersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomers(req.query));
});
exports.customerOverviewController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerOverview(String(req.params.customerId)));
});
exports.customerDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerDetails(String(req.params.customerId)));
});
exports.customerServicesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerServices(String(req.params.customerId)));
});
exports.customerJobsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerJobs(String(req.params.customerId), req.query));
});
exports.customerListingsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerListings(String(req.params.customerId), req.query));
});
exports.customerOrdersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerOrders(String(req.params.customerId), req.query));
});
exports.customerSalesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerSales(String(req.params.customerId), req.query));
});
exports.customerTransactionsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerTransactions(String(req.params.customerId), req.query));
});
exports.customerSubscriptionsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, await adminCustomerService.fetchCustomerSubscriptions(String(req.params.customerId), req.query));
});
exports.createCustomerController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const file = req.file;
    const user = await adminCustomerService.createCustomer({
        ...req.body,
        displayImage: file?.path || req.body.displayImage,
    }, requestingAdminId(req));
    const reset = await adminCustomerService.createCustomerPasswordReset(String(user._id), requestingAdminId(req));
    const { html, subject } = (0, templates_1.adminCreatedCustomerMessage)([user.firstName, user.lastName].filter(Boolean).join(" ") || "there", customerResetUrl(reset.token));
    let emailSent = true;
    try {
        await (0, send_email_1.sendEmail)(user.email, subject, html);
    }
    catch (error) {
        emailSent = false;
        console.error("Customer setup email failed:", error);
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, {
        ...(await adminCustomerService.fetchCustomerOverview(String(user._id))),
        emailSent,
    });
});
exports.updateCustomerProfileController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await adminCustomerService.updateCustomerProfile(String(req.params.customerId), req.body, requestingAdminId(req));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.triggerCustomerPasswordResetController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const reset = await adminCustomerService.createCustomerPasswordReset(String(req.params.customerId), requestingAdminId(req));
    const { html, subject } = (0, templates_1.customerPasswordResetMessage)([reset.user.firstName, reset.user.lastName].filter(Boolean).join(" ") || "there", customerResetUrl(reset.token));
    let sent = true;
    try {
        await (0, send_email_1.sendEmail)(reset.user.email, subject, html);
    }
    catch (error) {
        sent = false;
        console.error("Customer password reset email failed:", error);
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { sent, expiresAt: reset.expiresAt });
});
exports.suspendCustomerController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await adminCustomerService.suspendCustomer(String(req.params.customerId), req.body, requestingAdminId(req));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.reactivateCustomerController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await adminCustomerService.reactivateCustomer(String(req.params.customerId), req.body.reason, requestingAdminId(req));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.adjustCustomerWalletController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await adminCustomerService.adjustCustomerWallet(String(req.params.customerId), req.body, requestingAdminId(req));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.customerAuditHistoryController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await adminCustomerService.fetchCustomerAuditHistory(String(req.params.customerId), req.query);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.sendCustomerMessageController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const user = await adminCustomerService.logCustomerMessage(String(req.params.customerId), req.body.subject, requestingAdminId(req));
    await notificationService.createNotification({
        userId: user._id,
        title: req.body.subject,
        message: req.body.message,
        type: notification_enum_1.NotificationTypeEnum.info,
    });
    const { html, subject } = (0, templates_1.adminCustomerMessage)([user.firstName, user.lastName].filter(Boolean).join(" ") || "there", req.body.subject, req.body.message);
    let emailSent = true;
    try {
        await (0, send_email_1.sendEmail)(user.email, subject, html);
    }
    catch (error) {
        emailSent = false;
        console.error("Admin customer message email failed:", error);
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, { sent: true, emailSent });
});
