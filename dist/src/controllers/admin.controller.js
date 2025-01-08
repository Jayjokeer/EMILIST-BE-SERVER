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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserAdminController = exports.fetchUserDetails = exports.suspendUserAdminController = exports.verifyUserAdminController = exports.fetchAllUsersAdminController = exports.adminDashboardController = void 0;
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
exports.adminDashboardController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currency, year } = req.query;
    const data = {
        totalProducts: yield productService.fetchAllProductsForAdmin(),
        totalUsers: yield userService.fetchAllUsersAdminDashboard(),
        totalJobs: yield jobService.fetchAllJobsForAdminDashboard(),
        totalPrivateExperts: yield privateExpertService.fetchAllPrivateExpertsAAdminDashboard(),
        totalTransactions: yield transactionService.fetchTransactionChartAdminDashboard(year, currency),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.fetchAllUsersAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, q } = req.query;
    let userData = [];
    const { users, totalUsers } = yield userService.fetchAllUsersAdmin(page, limit, q);
    for (const user of users) {
        const subcription = yield subscriptionService.getSubscriptionById(String(user.subscription));
        const plan = yield planService.getPlanById(String(subcription.planId));
        const transactions = yield transactionService.fetchAllUserEarningsAdmin(String(user._id));
        userData.push({
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
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.verifyUserAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    yield userService.verifyUser(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, 'User verified successfully');
}));
exports.suspendUserAdminController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const user = yield userService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    user.status = user_enums_1.UserStatus.suspended;
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
