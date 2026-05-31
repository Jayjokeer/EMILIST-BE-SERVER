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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceController = exports.getExpertiseProfileController = exports.removeExpertiseItemController = exports.verifyExpertiseController = exports.createBusinessProfileController = exports.deleteBusinessItemController = exports.muteBusinessController = exports.markReviewController = exports.fetchBusinessReviewsController = exports.fetchSimilarBusinessByUserController = exports.fetchOtherBusinessByUserController = exports.unlikeBusinessController = exports.likeBusinessController = exports.fetchAllComparedBusinessesController = exports.compareBusinessController = exports.reviewBusinessController = exports.deleteBusinessController = exports.fetchAllBusinessController = exports.deleteBusinessImageController = exports.fetchSingleBusinessController = exports.fetchUserBusinessController = exports.updateBusinessController = exports.createBusinessController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const error_1 = require("../errors/error");
const businessService = __importStar(require("../services/business.service"));
const authService = __importStar(require("../services/auth.service"));
const reviewService = __importStar(require("../services/review.service"));
const validation_helper_1 = require("../helpers/validation.helper");
exports.createBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const businessData = req.body;
    const userId = req.user._id;
    businessData.userId = userId;
    const user = await authService.findUserById(String(userId));
    if (!user) {
        throw new error_1.NotFoundError("user not found!");
    }
    console.log(req.files);
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
    const data = await businessService.createBusiness(businessData);
    user.businesses?.push(data._id);
    await user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.updateBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const businessData = req.body;
    const { businessId } = req.params;
    const data = await businessService.updateBusiness(businessId, businessData, req.files);
    if (String(data.userId) !== String(req.user._id)) {
        throw new error_1.UnauthorizedError("Unauthorized");
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchUserBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const data = await businessService.fetchUserBusiness(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSingleBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId } = req.params;
    const { userId } = req.query;
    let liked = false;
    let isCompared = false;
    const business = await businessService.fetchSingleBusinessWithDetails(String(businessId));
    if (userId) {
        const likedBusiness = await businessService.ifLikedBusiness(businessId, userId);
        liked = !!likedBusiness;
        const user = await authService.findUserById(userId);
        if (user) {
            isCompared = user.comparedBusinesses.some((id) => id.toString() === businessId);
        }
    }
    ;
    const data = {
        business,
        liked,
        isCompared
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.deleteBusinessImageController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId, imageId } = req.params;
    const business = await businessService.fetchSingleBusiness(String(businessId));
    if (!business) {
        throw new error_1.NotFoundError("Business not found!");
    }
    if (String(business.userId._id) !== String(req.user._id)) {
        throw new error_1.UnauthorizedError("Unauthorized");
    }
    const imageIndex = business.businessImages?.findIndex((image) => image._id.toString() === imageId);
    if (imageIndex === -1) {
        throw new error_1.NotFoundError("Image not found");
    }
    business.businessImages?.splice(imageIndex, 1);
    await business.save();
    const data = await businessService.fetchSingleBusiness(String(businessId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 10, startPriceRange, expertType, minRating, minReviews, location, noticePeriod, currency, userId, search, } = req.query;
    const filters = {
        startPriceRange,
        expertType,
        minRating,
        minReviews,
        location,
        noticePeriod,
        currency,
    };
    const data = await businessService.fetchAllBusiness(userId, Number(page), Number(limit), filters, search);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.deleteBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId } = req.params;
    await businessService.deleteBusiness(businessId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Business deleted!");
});
exports.reviewBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { businessId, rating, comment } = req.body;
    const business = await businessService.fetchSingleBusiness(businessId);
    if (!business) {
        throw new error_1.NotFoundError("Business not found!");
    }
    if (String(business.userId) == String(userId)) {
        throw new error_1.BadRequestError("You cannot review your own service!");
    }
    const isReviewed = await reviewService.isReviewedbyUser(businessId, userId);
    if (isReviewed) {
        throw new error_1.BadRequestError("You have previously reviewed this business!");
    }
    const payload = {
        businessId,
        userId,
        rating,
        comment
    };
    const data = await reviewService.addReview(payload);
    business.reviews?.push(String(data._id));
    await business.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.compareBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { businessId } = req.params;
    const business = await businessService.fetchSingleBusiness(businessId);
    if (!business) {
        throw new error_1.NotFoundError("No service found!");
    }
    const user = await authService.findUserById(userId);
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
    await user.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        message: "Compared businesses updated successfully",
        comparedBusinesses: user.comparedBusinesses,
    });
});
exports.fetchAllComparedBusinessesController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const user = await authService.findUserById(userId);
    if (!user) {
        throw new error_1.NotFoundError("User not found");
    }
    ;
    const businesses = await businessService.fetchAllComparedBusinesses(user.comparedBusinesses);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, businesses);
});
exports.likeBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const { businessId } = req.params;
    const business = await businessService.fetchSingleBusiness(businessId);
    if (!business) {
        throw new error_1.NotFoundError("Service not found!");
    }
    ;
    const existingLike = await businessService.ifLikedBusiness(businessId, userId);
    if (existingLike) {
        throw new error_1.BadRequestError("Service previously liked!");
    }
    ;
    const data = await businessService.createBusinessLike({ business: businessId, user: userId });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.unlikeBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const { businessId } = req.params;
    const data = await businessService.unlikeBusiness(businessId, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchOtherBusinessByUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const data = await businessService.otherBusinessesByUser(userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchSimilarBusinessByUserController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId } = req.params;
    const data = await businessService.fetchSimilarBusinesses(businessId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchBusinessReviewsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId } = req.params;
    const { page = 1, limit = 10, sortBy } = req.query;
    const data = await businessService.fetchBusinessReviews(businessId, Number(page), Number(limit), sortBy);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.markReviewController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { reviewId } = req.params;
    const { userId, isHelpful } = req.body;
    const data = await businessService.markReviewHelpful(reviewId, isHelpful, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.muteBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user._id;
    const business = await businessService.fetchSingleBusiness(businessId);
    if (!business) {
        throw new error_1.NotFoundError("Service not found!");
    }
    if (String(userId) === String(business.userId)) {
        throw new error_1.BadRequestError("You cannot mute your own business!");
    }
    const user = await authService.findUserById(userId);
    const isMuted = user?.mutedBusinesses.includes(businessId);
    if (isMuted) {
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Business is already muted.");
    }
    user.mutedBusinesses.push(businessId);
    await user?.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Business muted successfully");
});
exports.deleteBusinessItemController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { businessId, itemType, itemId } = req.params;
    const userId = req.user._id;
    const business = await businessService.deleteBusinessItem(businessId, itemType, itemId, userId);
    if (!business) {
        throw new error_1.NotFoundError("Business not found or not owned by the user");
    }
    switch (itemType) {
        case "certificate": {
            return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
                message: "Certificate removed successfully"
            });
        }
        case "certificateImage": {
            return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
                message: "Certificate image removed successfully"
            });
        }
        case "membership": {
            return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
                message: "Membership removed successfully"
            });
        }
        case "insurance": {
            return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
                message: "Insurance removed successfully"
            });
        }
        default:
            throw new error_1.BadRequestError("Invalid itemType provided");
    }
});
//NEW CONTROLLERS FOR BUSINESS PROFILE CREATION WITHIN USER PROFILE SETUP AND EXPERTISE VERIFICATION
exports.createBusinessProfileController = (0, error_handler_1.catchAsync)(async (req, res, _next) => {
    const userId = (0, validation_helper_1.getUserId)(req);
    const dto = req.body;
    const result = await businessService.createBusinessProfileService(userId, dto, req.files);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, {
        profileCreated: result.profileCreated,
        business: result.business,
        service: result.service,
    });
});
exports.verifyExpertiseController = (0, error_handler_1.catchAsync)(async (req, res, _next) => {
    const userId = (0, validation_helper_1.getUserId)(req);
    const dto = {
        certificates: req.body.certificates,
        memberships: req.body.memberships,
        insurances: req.body.insurances,
    };
    const business = await businessService.verifyExpertise(userId, dto, {
        replace: req.query.replace === 'true',
        businessId: req.query.businessId,
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { business });
});
exports.removeExpertiseItemController = (0, error_handler_1.catchAsync)(async (req, res, _next) => {
    const userId = (0, validation_helper_1.getUserId)(req);
    const { section, itemId } = req.params;
    const allowed = ['certification', 'membership', 'insurance'];
    if (!allowed.includes(section)) {
        return res.status(400).json({
            success: false,
            message: `Invalid section. Must be one of: ${allowed.join(', ')}`,
        });
    }
    const business = await businessService.removeExpertiseItem(userId, section, itemId, req.query.businessId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { business });
});
exports.getExpertiseProfileController = (0, error_handler_1.catchAsync)(async (req, res, _next) => {
    const userId = (0, validation_helper_1.getUserId)(req);
    const data = await businessService.getExpertiseProfile(userId, req.query.businessId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { data });
});
exports.updateServiceController = (0, error_handler_1.catchAsync)(async (req, res, _next) => {
    const userId = (0, validation_helper_1.getUserId)(req);
    const { id: businessId } = req.params;
    const dto = {
        ...(req.body.services !== undefined && { services: req.body.services }),
        ...(req.body.coverageArea !== undefined && { coverageArea: req.body.coverageArea }),
        ...(req.body.sameAsProfile !== undefined && { sameAsProfile: req.body.sameAsProfile === true || req.body.sameAsProfile === 'true' }),
        ...(req.body.businessName !== undefined && { businessName: req.body.businessName }),
        ...(req.body.yearFounded !== undefined && { yearFounded: req.body.yearFounded }),
        ...(req.body.numberOfEmployee !== undefined && { numberOfEmployee: Number(req.body.numberOfEmployee) }),
        ...(req.body.businessAddress !== undefined && { businessAddress: req.body.businessAddress }),
        ...(req.body.businessState !== undefined && { businessState: req.body.businessState }),
        ...(req.body.businessCountry !== undefined && { businessCountry: req.body.businessCountry }),
        ...(req.body.startingPrice !== undefined && { startingPrice: Number(req.body.startingPrice) }),
        ...(req.body.currency !== undefined && { currency: req.body.currency }),
        ...(req.body.rateUnit !== undefined && { rateUnit: req.body.rateUnit }),
        ...(req.body.noticePeriod !== undefined && { noticePeriod: req.body.noticePeriod }),
        ...(req.body.businessDescription !== undefined && { businessDescription: req.body.businessDescription }),
        ...(req.body.businessImages !== undefined && { businessImages: req.body.businessImages }),
    };
    const business = await businessService.updateService(userId, String(businessId), dto);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, { business });
});
