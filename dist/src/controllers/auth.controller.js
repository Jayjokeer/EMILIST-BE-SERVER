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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDetailsController = exports.subscribeNewsLetterController = exports.countClicksController = exports.insightsController = exports.requestVerificationController = exports.inviteUserController = exports.findUserController = exports.deactivateUserController = exports.logoutController = exports.googleRedirectController = exports.resendVerificationOtpController = exports.uploadMultipleFiles = exports.uploadImage = exports.currentUserController = exports.changePasswordController = exports.updateAccountDetailsController = exports.updateUserController = exports.resetPasswordController = exports.forgetPasswordController = exports.verifyEmailController = exports.loginController = exports.registerUserController = void 0;
const success_response_1 = require("../helpers/success-response");
const authService = __importStar(require("../services/auth.service"));
const http_status_codes_1 = require("http-status-codes");
const hashing_1 = require("../utils/hashing");
const error_1 = require("../errors/error");
const utility_1 = require("../utils/utility");
const jwt_1 = require("../utils/jwt");
const error_handler_1 = require("../errors/error-handler");
const templates_1 = require("../utils/templates");
const send_email_1 = require("../utils/send_email");
const config_1 = require("../utils/config");
const user_enums_1 = require("../enums/user.enums");
const axios_1 = __importDefault(require("axios"));
const notificationService = __importStar(require("../services/notification.service"));
const notification_enum_1 = require("../enums/notification.enum");
const walletService = __importStar(require("../services/wallet.services"));
const subscriptionService = __importStar(require("../services/subscription.service"));
const planService = __importStar(require("../services/plan.service"));
const plan_enum_1 = require("../enums/plan.enum");
const jobService = __importStar(require("../services/job.service"));
const businessService = __importStar(require("../services/business.service"));
const productService = __importStar(require("../services/product.service"));
const newsLetterService = __importStar(require("../services/newsletter.service"));
exports.registerUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userName, email, password, } = req.body;
    const isEmailExists = yield authService.findUserByEmail(email);
    if (isEmailExists)
        throw new error_1.BadRequestError("User with email already exists!");
    const isUserNameExists = yield authService.findUserByUserName(userName);
    if (isUserNameExists)
        throw new error_1.BadRequestError("UserName already exists!");
    const encryptPwd = yield (0, hashing_1.hashPassword)(password);
    const user = {
        userName,
        email: email.toLowerCase(),
        password: encryptPwd,
        uniqueId: (0, utility_1.generateShortUUID)()
    };
    const data = yield authService.createUser(user);
    const userId = String(data._id);
    const { otp, otpCreatedAt, otpExpiryTime } = yield (0, utility_1.generateOTPData)(userId);
    data.otpExpiresAt = otpExpiryTime;
    data.registrationOtp = otp;
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
    const { html, subject } = (0, templates_1.otpMessage)(userName, otp);
    (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.loginController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const foundUser = yield authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("Invalid credentials!");
    if (!foundUser.password)
        throw new error_1.NotFoundError("Invalid credentials!");
    const pwdCompare = yield (0, hashing_1.comparePassword)(password, foundUser.password);
    if (!pwdCompare)
        throw new error_1.NotFoundError("Invalid credentials!");
    if (foundUser.status == user_enums_1.UserStatus.deactivated) {
        throw new error_1.UnauthorizedError("Account Deactivated!!");
    }
    if (foundUser.status == user_enums_1.UserStatus.suspended) {
        throw new error_1.UnauthorizedError("Account Suspended kindly Contact Admin!!");
    }
    if (foundUser.isEmailVerified == false) {
        throw new error_1.BadRequestError("Kindly verify your email!");
    }
    const token = yield (0, jwt_1.generateJWTwithExpiryDate)({
        email: foundUser.email,
        id: foundUser._id,
        userName: foundUser.userName
    });
    const userData = yield authService.findUserById(String(foundUser._id));
    const user = {
        token,
        userData
    };
    const checkWalletExists = yield walletService.findUserWallet(String(foundUser._id));
    if (!checkWalletExists) {
        const wallet = yield walletService.createWallet({ userId: foundUser._id, isDefault: true });
        foundUser.wallets.push(wallet._id);
        yield foundUser.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
}));
exports.verifyEmailController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    const foundUser = yield authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const tokenData = yield authService.findTokenService(otp);
    if (!tokenData)
        throw new error_1.BadRequestError("Otp expired!");
    if (foundUser.registrationOtp !== tokenData.registrationOtp)
        throw new error_1.BadRequestError("Otp expired!");
    foundUser.isEmailVerified = true;
    foundUser.registrationOtp = undefined;
    foundUser.otpExpiresAt = undefined;
    yield foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Email verified successfully!");
}));
exports.forgetPasswordController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const foundUser = yield authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const { otp, otpExpiryTime } = yield (0, utility_1.generateOTPData)(String(foundUser._id));
    foundUser.otpExpiresAt = otpExpiryTime;
    foundUser.passwordResetOtp = otp;
    yield foundUser.save();
    const { html, subject } = (0, templates_1.passwordResetMessage)(foundUser.userName, otp);
    yield (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset OTP sent to your email.");
}));
exports.resetPasswordController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, newPassword } = req.body;
    const foundUser = yield authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    if (foundUser.passwordResetOtp !== otp)
        throw new error_1.BadRequestError("Invalid OTP");
    if (foundUser.otpExpiresAt && Date.now() > foundUser.otpExpiresAt.getTime()) {
        throw new error_1.BadRequestError("OTP expired, request a new one.");
    }
    const hashedPassword = yield (0, hashing_1.hashPassword)(newPassword);
    foundUser.password = hashedPassword;
    foundUser.passwordResetOtp = undefined;
    foundUser.otpExpiresAt = undefined;
    if (foundUser.isEmailVerified == false) {
        foundUser.isEmailVerified = true;
    }
    yield foundUser.save();
    const notificationPayload = {
        userId: foundUser._id,
        title: " Password Reset",
        message: "You just reset your password",
        type: notification_enum_1.NotificationTypeEnum.info
    };
    yield notificationService.createNotification(notificationPayload);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset successfully!");
}));
exports.updateUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { fullName, gender, language, number1, number2, whatsAppNo, location, bio, } = req.body;
    const foundUser = yield authService.findUserById(userId);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
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
    yield foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, foundUser);
}));
exports.updateAccountDetailsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.user.email;
    const { password, number, holdersName, bank, } = req.body;
    const foundUser = yield authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const pwdCompare = yield (0, hashing_1.comparePassword)(password, foundUser.password);
    if (!pwdCompare)
        throw new error_1.NotFoundError("Invalid credentials!");
    foundUser.accountDetails.number = number;
    foundUser.accountDetails.holdersName = holdersName;
    foundUser.accountDetails.bank = bank;
    yield foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, foundUser);
}));
exports.changePasswordController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const foundUser = yield authService.findUserByIdWithPassword(userId);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const isPasswordValid = yield (0, hashing_1.comparePassword)(currentPassword, foundUser.password);
    if (!isPasswordValid)
        throw new error_1.UnauthorizedError("Current password is incorrect!");
    const hashedNewPassword = yield (0, hashing_1.hashPassword)(newPassword);
    foundUser.password = hashedNewPassword;
    yield foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password changed successfully!");
}));
exports.currentUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const user = yield authService.findUserById(userId);
    if (!user)
        throw new error_1.NotFoundError("User not found!");
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
}));
exports.uploadImage = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = req.file.path;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, imageUrl);
}));
exports.uploadMultipleFiles = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    const fileUrls = files.map(file => file.path);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, fileUrls);
}));
exports.resendVerificationOtpController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        throw new error_1.BadRequestError("Email is required");
    }
    const user = yield authService.findUserByEmail(email);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    if (user.isEmailVerified) {
        throw new error_1.BadRequestError("Email not verified!");
    }
    const userId = String(user._id);
    const { otp, otpCreatedAt, otpExpiryTime } = yield (0, utility_1.generateOTPData)(userId);
    user.otpExpiresAt = otpExpiryTime;
    user.registrationOtp = otp;
    yield user.save();
    const { html, subject } = yield (0, templates_1.otpMessage)(user.userName, otp);
    yield (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Otp sent successfully");
}));
exports.googleRedirectController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loggedIn = req.user;
    const token = (0, jwt_1.generateJWTwithExpiryDate)({
        email: loggedIn.email,
        id: loggedIn.id,
        userName: loggedIn.userName,
    });
    const userData = yield authService.findUserById(loggedIn.id);
    const queryParams = new URLSearchParams({
        token,
        id: userData.id,
        email: userData.email,
        userName: userData.userName,
    }).toString();
    res.redirect(`${config_1.config.frontendUrl}?${queryParams}`);
}));
exports.logoutController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield authService.findUserById(req.user.id);
    console.log(user);
    console.log(req.user.accessToken);
    if (user && user.accessToken) {
        yield axios_1.default.get(`https://accounts.google.com/o/oauth2/revoke?token=${user.accessToken}`);
        user.accessToken = undefined;
        yield user.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Successfully logged out.");
}));
exports.deactivateUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loggedIn = req.user;
    const deactivateUser = yield authService.updateUserById(loggedIn.id, { status: user_enums_1.UserStatus.deactivated });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Successfully deactivated!");
}));
exports.findUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.query;
    if (!user) {
        throw new error_1.BadRequestError("Query is required to search for a user");
    }
    const data = yield authService.findSpecificUser(user);
    if (!data) {
        throw new error_1.NotFoundError("User not found!");
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.inviteUserController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email } = req.query;
    const userId = req.user._id;
    if (!email) {
        throw new error_1.BadRequestError("Email is required!");
    }
    ;
    const user = yield authService.findUserByEmail(email);
    if (user) {
        throw new error_1.NotFoundError("User is already on the platform!");
    }
    const loggedInUser = yield authService.findUserById(userId);
    if (!loggedInUser) {
        throw new error_1.NotFoundError("User not found!");
    }
    (_a = loggedInUser.invitedUsers) === null || _a === void 0 ? void 0 : _a.push(email);
    yield loggedInUser.save();
    const { html, subject } = (0, templates_1.sendInviteMessage)(req.user.userName, config_1.config.frontendSignUpUrl);
    yield (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Invite sent successfully");
}));
exports.requestVerificationController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const user = yield authService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found!");
    }
    user.requestedVerification = true;
    yield (user === null || user === void 0 ? void 0 : user.save());
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Verification request sent successfully");
}));
exports.insightsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const userId = req.user._id;
    const user = yield authService.findUserWithoutDetailsById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found!");
    }
    ;
    let totalCount = 0;
    const uniqueClicks = new Set();
    const totalJobClicks = yield jobService.fetchAllUserJobsAdmin(userId);
    for (const job of totalJobClicks) {
        totalCount += Number(((_a = job === null || job === void 0 ? void 0 : job.clicks) === null || _a === void 0 ? void 0 : _a.clickCount) || 0);
        if ((_b = job === null || job === void 0 ? void 0 : job.clicks) === null || _b === void 0 ? void 0 : _b.userId) {
            uniqueClicks.add(String(job.clicks.userId));
        }
    }
    ;
    const totalMaterialsClicks = yield productService.fetchAllUserProductsAdmin(userId);
    for (const material of totalMaterialsClicks) {
        totalCount += Number(((_c = material === null || material === void 0 ? void 0 : material.clicks) === null || _c === void 0 ? void 0 : _c.clickCount) || 0);
        if ((_d = material === null || material === void 0 ? void 0 : material.clicks) === null || _d === void 0 ? void 0 : _d.userId) {
            uniqueClicks.add(String(material.clicks.userId));
        }
    }
    ;
    const totalBusinessClicks = yield businessService.fetchAllUserBusinessesAdmin(userId);
    for (const business of totalBusinessClicks) {
        totalCount += Number(((_e = business === null || business === void 0 ? void 0 : business.clicks) === null || _e === void 0 ? void 0 : _e.clickCount) || 0);
        if ((_f = business === null || business === void 0 ? void 0 : business.clicks) === null || _f === void 0 ? void 0 : _f.userId) {
            uniqueClicks.add(String(business.clicks.userId));
        }
    }
    ;
    const subscription = yield subscriptionService.getSubscriptionById(String(user.subscription));
    if (!subscription) {
        throw new error_1.NotFoundError("subscription not found");
    }
    const startDate = subscription.startDate;
    const endDate = subscription.endDate;
    const planId = subscription.planId;
    const plan = yield planService.getPlanById(String(planId));
    if (!plan) {
        throw new error_1.NotFoundError("No plan found");
    }
    let daysLeft = null;
    let daysUsed = null;
    if (plan.name !== plan_enum_1.PlanEnum.basic) {
        const today = new Date();
        const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)); // Total subscription period in days
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
    const jobLikes = yield jobService.fetchAllLikedJobs(String(user._id));
    const productLikes = yield productService.fetchAllLikedProducts(String(user._id));
    const businessLikes = yield businessService.fetchAllLikedBusinesses(String(user._id));
    const totalSaved = jobLikes.totalLikedJobs + productLikes.totalProductsLikes + businessLikes.totalLikedBusinesses;
    const data = {
        saved: totalSaved,
        contact: (_g = user.invitedUsers) === null || _g === void 0 ? void 0 : _g.length,
        shared: user.sharedCount,
        clicks: totalCount,
        reached: uniqueClicks.size,
        promotionDuration: responseData
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.countClicksController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { service, serviceId, userId } = req.query;
    if (!service) {
        throw new error_1.BadRequestError('Service is required!');
    }
    if (!['business', 'material', 'job', 'shared'].includes(service)) {
        throw new error_1.BadRequestError("Invalid service type!");
    }
    let user;
    if (userId) {
        user = yield authService.findUserById(userId);
        if (!user) {
            throw new error_1.NotFoundError("User not found!");
        }
    }
    let data;
    if (service === 'job') {
        const jobId = serviceId;
        data = yield jobService.fetchJobById(jobId);
        console.log(data);
        if (!data) {
            throw new error_1.NotFoundError("Job not found");
        }
    }
    else if (service === 'business') {
        data = yield businessService.fetchSingleBusiness(serviceId);
        if (!data) {
            throw new error_1.NotFoundError("Business not found");
        }
    }
    else if (service === 'materials') {
        data = yield productService.fetchProductById(serviceId);
        if (!data) {
            throw new error_1.NotFoundError("Material not found");
        }
    }
    else if (service === 'shared') {
        user.sharedCount += 1;
        yield (user === null || user === void 0 ? void 0 : user.save());
    }
    if (service !== 'shared') {
        if (userId) {
            if (!data.clicks.users.includes(userId)) {
                data.clicks.users.push(userId);
            }
        }
        data.clicks.clickCount = (data.clicks.clickCount || 0) + 1;
        yield data.save();
    }
    ;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Successful");
}));
exports.subscribeNewsLetterController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    yield newsLetterService.subscribeNewsLetter(email);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Newsletter subscribed successfully");
}));
exports.getUserDetailsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const data = yield authService.findUserWithoutPhoneNumberDetailsById(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
