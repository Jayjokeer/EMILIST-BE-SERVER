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
exports.saveUserProfile = exports.getProfileContext = exports.deleteUserController = exports.getUserDetailsController = exports.subscribeNewsLetterController = exports.countClicksController = exports.insightsController = exports.requestVerificationController = exports.inviteUserController = exports.findUserController = exports.deactivateUserController = exports.logoutController = exports.googleRedirectController = exports.resendVerificationOtpController = exports.uploadMultipleFiles = exports.uploadImage = exports.currentUserController = exports.changePasswordController = exports.updateAccountDetailsController = exports.updateUserController = exports.verifyPasswordOtpController = exports.resetPasswordController = exports.forgetPasswordController = exports.verifyEmailController = exports.loginController = exports.registerUserController = void 0;
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
const verificationService = __importStar(require("../services/verification.service"));
const validation_helper_1 = require("../helpers/validation.helper");
exports.registerUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, password, } = req.body;
    const isEmailExists = await authService.findUserByEmail(email.toLowerCase());
    if (isEmailExists)
        throw new error_1.BadRequestError("User with email already exists!");
    const encryptPwd = await (0, hashing_1.hashPassword)(password);
    const newUser = {
        email: email.toLowerCase(),
        password: encryptPwd,
        uniqueId: (0, utility_1.generateShortUUID)()
    };
    const data = await authService.createUser(newUser);
    const userId = String(data._id);
    const { otp, otpCreatedAt, otpExpiryTime } = await (0, utility_1.generateOTPData)(userId);
    data.otpExpiresAt = otpExpiryTime;
    data.registrationOtp = otp;
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
    const { html, subject } = (0, templates_1.otpMessage)(otp);
    (0, send_email_1.sendEmail)(email, subject, html);
    const token = await (0, jwt_1.generateJWTwithExpiryDate)({
        email: data.email,
        id: data._id,
    });
    const userData = await authService.findCurrentUserById(String(data._id));
    const user = {
        token,
        userData
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, user);
});
exports.loginController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const foundUser = await authService.findUserByEmail(email.toLowerCase());
    if (!foundUser)
        throw new error_1.NotFoundError("Invalid credentials!");
    if (!foundUser.password)
        throw new error_1.NotFoundError("Invalid credentials!");
    const pwdCompare = await (0, hashing_1.comparePassword)(password, foundUser.password);
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
    const token = await (0, jwt_1.generateJWTwithExpiryDate)({
        email: foundUser.email,
        id: foundUser._id,
    });
    const userData = await authService.findCurrentUserById(String(foundUser._id));
    const user = {
        token,
        userData
    };
    const checkWalletExists = await walletService.findUserWallet(String(foundUser._id));
    if (!checkWalletExists) {
        const wallet = await walletService.createWallet({ userId: foundUser._id, isDefault: true });
        foundUser.wallets.push(wallet._id);
        await foundUser.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
});
exports.verifyEmailController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, otp } = req.body;
    const foundUser = await authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const tokenData = await authService.findTokenService(otp);
    if (!tokenData)
        throw new error_1.BadRequestError("Otp expired!");
    if (foundUser.registrationOtp !== tokenData.registrationOtp)
        throw new error_1.BadRequestError("Otp expired!");
    foundUser.isEmailVerified = true;
    foundUser.registrationOtp = undefined;
    foundUser.otpExpiresAt = undefined;
    await foundUser.save();
    const token = await (0, jwt_1.generateJWTwithExpiryDate)({
        email: foundUser.email,
        id: foundUser._id,
    });
    const userData = await authService.findCurrentUserById(String(foundUser._id));
    const user = {
        token,
        userData
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
});
exports.forgetPasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    const foundUser = await authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const { otp, otpExpiryTime } = await (0, utility_1.generateOTPData)(String(foundUser._id));
    foundUser.otpExpiresAt = otpExpiryTime;
    foundUser.passwordResetOtp = otp;
    await foundUser.save();
    const { html, subject } = (0, templates_1.passwordResetMessage)('user', otp);
    (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset OTP sent to your email.");
});
exports.resetPasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, newPassword } = req.body;
    const foundUser = await authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const hashedPassword = await (0, hashing_1.hashPassword)(newPassword);
    foundUser.password = hashedPassword;
    if (foundUser.isEmailVerified == false) {
        foundUser.isEmailVerified = true;
    }
    await foundUser.save();
    const notificationPayload = {
        userId: foundUser._id,
        title: " Password Reset",
        message: "You just reset your password",
        type: notification_enum_1.NotificationTypeEnum.info
    };
    await notificationService.createNotification(notificationPayload);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password reset successfully!");
});
exports.verifyPasswordOtpController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email, otp } = req.body;
    const foundUser = await authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    if (foundUser.passwordResetOtp !== otp)
        throw new error_1.BadRequestError("Invalid OTP");
    if (foundUser.otpExpiresAt && Date.now() > foundUser.otpExpiresAt.getTime()) {
        throw new error_1.BadRequestError("OTP expired, request a new one.");
    }
    foundUser.passwordResetOtp = undefined;
    foundUser.otpExpiresAt = undefined;
    await foundUser.save();
    const data = {
        email: email
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.updateUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, gender, countryCode, languages, houseAddress, mobile, city, state, country, bio, } = req.body;
    const foundUser = await authService.findUserById(userId);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    foundUser.firstName = firstName || foundUser.firstName;
    foundUser.lastName = lastName || foundUser.lastName;
    foundUser.gender = gender || foundUser.gender;
    foundUser.languages = languages || foundUser.languages || [];
    foundUser.mobile = mobile || foundUser.mobile;
    foundUser.countryCode = countryCode || foundUser.countryCode;
    foundUser.houseAddress = houseAddress || foundUser.houseAddress;
    foundUser.city = city || foundUser.city;
    foundUser.bio = bio || foundUser.bio;
    foundUser.state = state || foundUser.state;
    foundUser.country = country || foundUser.country;
    foundUser.isProfileComplete = true;
    if (req.file) {
        foundUser.displayImage = req.file.path;
    }
    await foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, 'User profile updated successfully');
});
exports.updateAccountDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const email = req.user.email;
    const { password, number, holdersName, bank, } = req.body;
    const foundUser = await authService.findUserByEmail(email);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const pwdCompare = await (0, hashing_1.comparePassword)(password, foundUser.password);
    if (!pwdCompare)
        throw new error_1.NotFoundError("Invalid credentials!");
    foundUser.accountDetails.number = number;
    foundUser.accountDetails.holdersName = holdersName;
    foundUser.accountDetails.bank = bank;
    await foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, foundUser);
});
exports.changePasswordController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const foundUser = await authService.findUserByIdWithPassword(userId);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const isPasswordValid = await (0, hashing_1.comparePassword)(currentPassword, foundUser.password);
    if (!isPasswordValid)
        throw new error_1.UnauthorizedError("Current password is incorrect!");
    const hashedNewPassword = await (0, hashing_1.hashPassword)(newPassword);
    foundUser.password = hashedNewPassword;
    await foundUser.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Password changed successfully!");
});
exports.currentUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const foundUser = await authService.findCurrentUserById(userId);
    if (!foundUser)
        throw new error_1.NotFoundError("User not found!");
    const token = await (0, jwt_1.generateJWTwithExpiryDate)({
        email: foundUser.email,
        id: foundUser._id,
    });
    const user = {
        token,
        userData: foundUser
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, user);
});
exports.uploadImage = (0, error_handler_1.catchAsync)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = req.file.path;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, imageUrl);
});
exports.uploadMultipleFiles = (0, error_handler_1.catchAsync)(async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    const fileUrls = files.map(file => file.path);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, fileUrls);
});
exports.resendVerificationOtpController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new error_1.BadRequestError("Email is required");
    }
    const user = await authService.findUserByEmail(email);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    if (user.isEmailVerified) {
        throw new error_1.BadRequestError("Email not verified!");
    }
    const userId = String(user._id);
    const { otp, otpCreatedAt, otpExpiryTime } = await (0, utility_1.generateOTPData)(userId);
    user.otpExpiresAt = otpExpiryTime;
    user.registrationOtp = otp;
    await user.save();
    const { html, subject } = await (0, templates_1.otpMessage)(otp);
    await (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Otp sent successfully");
});
exports.googleRedirectController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const loggedIn = req.user;
    console.log('redirect controller');
    const token = (0, jwt_1.generateJWTwithExpiryDate)({
        email: loggedIn.email,
        id: loggedIn.id,
    });
    const userData = await authService.findCurrentUserById(loggedIn.id);
    res.cookie('sessionId', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        domain: 'emilist.com',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(`${config_1.config.frontendUrl}`);
});
exports.logoutController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const user = await authService.findUserById(req.user.id);
    if (user && user.accessToken) {
        await axios_1.default.get(`https://accounts.google.com/o/oauth2/revoke?token=${user.accessToken}`);
        user.accessToken = undefined;
        await user.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Successfully logged out.");
});
exports.deactivateUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const loggedIn = req.user;
    const deactivateUser = await authService.updateUserById(loggedIn.id, { status: user_enums_1.UserStatus.deactivated });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Successfully deactivated!");
});
exports.findUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { user } = req.query;
    if (!user) {
        throw new error_1.BadRequestError("Query is required to search for a user");
    }
    const data = await authService.findSpecificUser(user);
    if (!data) {
        throw new error_1.NotFoundError("User not found!");
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.inviteUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email } = req.query;
    const userId = req.user._id;
    if (!email) {
        throw new error_1.BadRequestError("Email is required!");
    }
    ;
    const user = await authService.findUserByEmail(email);
    if (user) {
        throw new error_1.NotFoundError("User is already on the platform!");
    }
    const loggedInUser = await authService.findUserById(userId);
    if (!loggedInUser) {
        throw new error_1.NotFoundError("User not found!");
    }
    loggedInUser.invitedUsers?.push(email);
    await loggedInUser.save();
    const { html, subject } = (0, templates_1.sendInviteMessage)(req.user.userName, config_1.config.frontendSignUpUrl);
    await (0, send_email_1.sendEmail)(email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Invite sent successfully");
});
exports.requestVerificationController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { type, businessId, certificateId } = req.query;
    const userId = req.user._id;
    const user = await authService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found!");
    }
    let verification;
    if (type == 'user') {
        user.requestedVerification = true;
        await user?.save();
        const payload = {
            userId,
            type
        };
        verification = await verificationService.createVerification(payload);
    }
    else if (type == 'business') {
        if (!businessId) {
            throw new error_1.BadRequestError("businessID is required");
        }
        const business = await businessService.fetchSingleBusiness(businessId);
        if (!business) {
            throw new error_1.NotFoundError("Business not found");
        }
        ;
        const payload = {
            userId,
            businessId,
            type,
        };
        verification = await verificationService.createVerification(payload);
    }
    else if (type == 'certificate') {
        if (!certificateId || !businessId) {
            throw new error_1.BadRequestError("business and certificate id are required");
        }
        const business = await businessService.fetchSingleBusiness(businessId);
        if (!business) {
            throw new error_1.NotFoundError("Business not found");
        }
        const certificate = business.certification.find((cert) => cert._id.toString() === certificateId.toString());
        if (!certificate) {
            throw new error_1.NotFoundError("Certificate not found for this business");
        }
        const payload = {
            userId,
            businessId,
            certificateId,
            type,
        };
        verification = await verificationService.createVerification(payload);
    }
    const data = {
        message: "Verification request sent successfully",
        verification
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.insightsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const user = await authService.findUserWithoutDetailsById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found!");
    }
    ;
    let totalCount = 0;
    const uniqueClicks = new Set();
    const totalJobClicks = await jobService.fetchAllUserJobsAdmin(userId);
    for (const job of totalJobClicks) {
        totalCount += Number(job?.clicks?.clickCount || 0);
        if (job?.clicks?.userId) {
            uniqueClicks.add(String(job.clicks.userId));
        }
    }
    ;
    const totalMaterialsClicks = await productService.fetchAllUserProductsAdmin(userId);
    for (const material of totalMaterialsClicks) {
        totalCount += Number(material?.clicks?.clickCount || 0);
        // if (material?.clicks?.userId) {
        //   uniqueClicks.add(String(material.clicks.userId));
        // }
    }
    ;
    const totalBusinessClicks = await businessService.fetchAllUserBusinessesAdmin(userId);
    for (const business of totalBusinessClicks) {
        totalCount += Number(business?.clicks?.clickCount || 0);
        if (business?.clicks?.userId) {
            uniqueClicks.add(String(business.clicks.userId));
        }
    }
    ;
    const subscription = await subscriptionService.getSubscriptionById(String(user.subscription));
    if (!subscription) {
        throw new error_1.NotFoundError("subscription not found");
    }
    const startDate = subscription.startDate;
    const endDate = subscription.endDate;
    const planId = subscription.planId;
    const plan = await planService.getPlanById(String(planId));
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
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.countClicksController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { service, serviceId, userId } = req.query;
    if (!service) {
        throw new error_1.BadRequestError('Service is required!');
    }
    if (!['business', 'material', 'job', 'shared'].includes(service)) {
        throw new error_1.BadRequestError("Invalid service type!");
    }
    let user;
    if (userId) {
        user = await authService.findUserById(userId);
        if (!user) {
            throw new error_1.NotFoundError("User not found!");
        }
    }
    let data;
    if (service === 'job') {
        const jobId = serviceId;
        data = await jobService.fetchJobById(jobId);
        console.log(data);
        if (!data) {
            throw new error_1.NotFoundError("Job not found");
        }
    }
    else if (service === 'business') {
        data = await businessService.fetchSingleBusiness(serviceId);
        if (!data) {
            throw new error_1.NotFoundError("Business not found");
        }
    }
    else if (service === 'materials') {
        data = await productService.fetchProductById(serviceId);
        if (!data) {
            throw new error_1.NotFoundError("Material not found");
        }
    }
    else if (service === 'shared') {
        user.sharedCount += 1;
        await user?.save();
    }
    if (service !== 'shared') {
        if (userId) {
            if (!data.clicks.users.includes(userId)) {
                data.clicks.users.push(userId);
            }
        }
        data.clicks.clickCount = (data.clicks.clickCount || 0) + 1;
        await data.save();
    }
    ;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Successful");
});
exports.subscribeNewsLetterController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    await newsLetterService.subscribeNewsLetter(email);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Newsletter subscribed successfully");
});
exports.getUserDetailsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const data = await authService.findUserWithoutPhoneNumberDetailsById(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.deleteUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const data = await authService.deleteUser(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, 'User deleted sucessfully');
});
exports.getProfileContext = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    const forceNewBusiness = req.query.newBusiness === 'true';
    const result = await authService.getProfileContextService(userId, forceNewBusiness);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, result);
});
exports.saveUserProfile = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    const data = (0, validation_helper_1.extractProfileDto)(req);
    const result = await authService.saveUserProfile(userId, data, req.files);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, result);
});
