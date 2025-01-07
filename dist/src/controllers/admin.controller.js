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
exports.verifyUserAdminController = exports.fetchAllUsersAdminController = exports.adminDashboardController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const productService = __importStar(require("../services/product.service"));
const http_status_codes_1 = require("http-status-codes");
const subscriptionService = __importStar(require("../services/subscription.service"));
const userService = __importStar(require("../services/auth.service"));
const jobService = __importStar(require("../services/job.service"));
const privateExpertService = __importStar(require("../services/private-expert.service"));
const transactionService = __importStar(require("../services/transaction.service"));
const planService = __importStar(require("../services/plan.service"));
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
