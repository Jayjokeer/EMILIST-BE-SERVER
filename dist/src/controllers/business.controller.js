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
exports.fetchAllComparedBusinessesController = exports.compareBusinessController = exports.reviewBusinessController = exports.deleteBusinessController = exports.fetchAllBusinessController = exports.deleteBusinessImageController = exports.fetchSingleBusinessController = exports.fetchUserBusinessController = exports.updateBusinessController = exports.createBusinessController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const error_1 = require("../errors/error");
const businessService = __importStar(require("../services/business.service"));
const authService = __importStar(require("../services/auth.service"));
const reviewService = __importStar(require("../services/review.service"));
exports.createBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const businessData = req.body;
    const userId = req.user._id;
    businessData.userId = userId;
    const user = yield authService.findUserById(String(userId));
    if (!user) {
        throw new error_1.NotFoundError("user not found!");
    }
    if (req.files && req.files['profileImage'] && req.files['profileImage'][0]) {
        businessData.profileImage = req.files['profileImage'][0].path;
    }
    if (req.files && req.files['businessImages']) {
        businessData.businessImages = req.files['businessImages'].map((file) => ({
            imageUrl: file.path
        }));
    }
    if (businessData.certification) {
        businessData.certification.forEach((certData, index) => {
            let certificatePath;
            if (req.files && req.files['certificate'] && req.files['certificate'][index]) {
                certificatePath = req.files['certificate'][index].path;
                businessData.certification[index].certificate = certificatePath;
            }
        });
    }
    const data = yield businessService.createBusiness(businessData);
    (_a = user.businesses) === null || _a === void 0 ? void 0 : _a.push(data._id);
    yield user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.updateBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const businessData = req.body;
    const { businessId } = req.params;
    const data = yield businessService.updateBusiness(businessId, businessData, req.files);
    if (String(data.userId) !== String(req.user._id)) {
        throw new error_1.UnauthorizedError("Unauthorized");
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchUserBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const data = yield businessService.fetchUserBusiness(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchSingleBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { businessId } = req.params;
    const data = yield businessService.fetchSingleBusinessWithDetails(String(businessId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.deleteBusinessImageController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { businessId, imageId } = req.params;
    const business = yield businessService.fetchSingleBusiness(String(businessId));
    if (!business) {
        throw new error_1.NotFoundError("Business not found!");
    }
    if (String(business.userId) !== String(req.user._id)) {
        throw new error_1.UnauthorizedError("Unauthorized");
    }
    const imageIndex = (_a = business.businessImages) === null || _a === void 0 ? void 0 : _a.findIndex((image) => image._id.toString() === imageId);
    if (imageIndex === -1) {
        throw new error_1.NotFoundError("Image not found");
    }
    (_b = business.businessImages) === null || _b === void 0 ? void 0 : _b.splice(imageIndex, 1);
    yield business.save();
    const data = yield businessService.fetchSingleBusiness(String(businessId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchAllBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, startPriceRange, expertType, minRating, minReviews, location, noticePeriod, userId, search, } = req.query;
    const filters = {
        startPriceRange,
        expertType,
        minRating,
        minReviews,
        location,
        noticePeriod
    };
    const data = yield businessService.fetchAllBusiness(userId, Number(page), Number(limit), filters, search);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.deleteBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { businessId } = req.params;
    yield businessService.deleteBusiness(businessId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Business deleted!");
}));
exports.reviewBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const { businessId, rating, comment } = req.body;
    const business = yield businessService.fetchSingleBusiness(businessId);
    if (!business) {
        throw new error_1.NotFoundError("Business not found!");
    }
    if (String(business.userId) == String(userId)) {
        throw new error_1.BadRequestError("You cannot review your own service!");
    }
    const isReviewed = yield reviewService.isReviewedbyUser(businessId, userId);
    if (isReviewed) {
        throw new error_1.BadRequestError("You have previously reviewed this business!");
    }
    const payload = {
        businessId,
        userId,
        rating,
        comment
    };
    const data = yield reviewService.addReview(payload);
    (_a = business.reviews) === null || _a === void 0 ? void 0 : _a.push(String(data._id));
    yield business.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.compareBusinessController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { businessId } = req.params;
    console.log(userId);
    const business = yield businessService.fetchSingleBusiness(businessId);
    if (!business) {
        throw new error_1.NotFoundError("No service found!");
    }
    const user = yield authService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    const businessIndex = user.comparedBusinesses.findIndex((id) => id.toString() === businessId);
    if (businessIndex !== -1) {
        user.comparedBusinesses.splice(businessIndex, 1);
    }
    else {
        user.comparedBusinesses.push(businessId);
    }
    yield user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: "Compared businesses updated successfully",
        comparedBusinesses: user.comparedBusinesses,
    });
}));
exports.fetchAllComparedBusinessesController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const user = yield authService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    ;
    const businesses = yield businessService.fetchAllComparedBusinesses(user.comparedBusinesses);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, businesses);
}));
