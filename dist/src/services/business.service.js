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
exports.markReviewHelpful = exports.fetchBusinessReviews = exports.fetchSimilarBusinesses = exports.otherBusinessesByUser = exports.unlikeBusiness = exports.createBusinessLike = exports.ifLikedBusiness = exports.fetchAllComparedBusinesses = exports.fetchAllUserBusinessesAdmin = exports.deleteBusiness = exports.fetchAllBusiness = exports.fetchSingleBusinessWithDetails = exports.fetchSingleBusiness = exports.fetchUserBusiness = exports.updateBusiness = exports.createBusiness = void 0;
const error_1 = require("../errors/error");
const business_model_1 = __importDefault(require("../models/business.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const userService = __importStar(require("./auth.service"));
const projectService = __importStar(require("../services/project.service"));
const businessLike_model_1 = __importDefault(require("../models/businessLike.model"));
const createBusiness = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield business_model_1.default.create(data);
});
exports.createBusiness = createBusiness;
const updateBusiness = (businessId, businessData, files) => __awaiter(void 0, void 0, void 0, function* () {
    const business = yield business_model_1.default.findById(businessId);
    if (!business) {
        throw new Error('Business not found');
    }
    if (businessData.renderedServices) {
        businessData.renderedServices.forEach((newService) => {
            const existingServiceIndex = business.renderedServices.findIndex((service) => String(service._id) == String(newService.id));
            if (existingServiceIndex !== -1) {
                business.renderedServices[existingServiceIndex] = Object.assign(Object.assign({}, business.renderedServices[existingServiceIndex]), newService);
            }
            else {
                business.renderedServices.push(newService);
            }
        });
    }
    if (businessData.certification) {
        businessData.certification.forEach((newCert) => {
            var _a;
            const existingCert = business.certification.find((cert) => String(cert._id) === String(newCert.id));
            if (existingCert) {
                if (files && files['certificate'] && files['certificate'].path) {
                    existingCert.certificate = files['certificate'].path;
                }
                existingCert.issuingOrganisation = newCert.issuingOrganisation || existingCert.issuingOrganisation;
                existingCert.verificationNumber = newCert.verificationNumber || existingCert.verificationNumber;
                existingCert.issuingDate = newCert.issuingDate || existingCert.issuingDate;
                existingCert.expiringDate = newCert.expiringDate || existingCert.expiringDate;
                existingCert.isCertificateExpire = newCert.isCertificateExpire || existingCert.isCertificateExpire;
            }
            else {
                const certificatePath = (_a = files === null || files === void 0 ? void 0 : files['certificate'][0]) === null || _a === void 0 ? void 0 : _a.path;
                newCert.certificate = certificatePath;
                business.certification.push(Object.assign({}, newCert));
            }
        });
    }
    if (businessData.membership) {
        businessData.membership.forEach((newMembership) => {
            const existingMembership = business.membership.find((membership) => String(membership._id) === String(newMembership.id));
            if (existingMembership) {
                existingMembership.organisation = newMembership.organisation || existingMembership.organisation;
                existingMembership.positionHeld = newMembership.positionHeld || existingMembership.positionHeld;
                existingMembership.startDate = newMembership.startDate || existingMembership.startDate;
                existingMembership.endDate = newMembership.endDate || existingMembership.endDate;
                existingMembership.isMembershipExpire = newMembership.isMembershipExpire || existingMembership.isMembershipExpire;
            }
            else {
                business.membership.push(newMembership);
            }
        });
    }
    if (businessData.insurance) {
        businessData.insurance.forEach((newInsurance) => {
            const existingInsurance = business.insurance.find((ins) => String(ins._id) == String(newInsurance.id));
            if (existingInsurance) {
                existingInsurance.issuingOrganisation = newInsurance.issuingOrganisation || existingInsurance.issuingOrganisation;
                existingInsurance.coverage = newInsurance.coverage || existingInsurance.coverage;
                existingInsurance.description = newInsurance.description || existingInsurance.description;
            }
            else {
                business.insurance.push(newInsurance);
            }
        });
    }
    business.firstName = businessData.firstName || business.firstName;
    business.lastName = businessData.lastName || business.lastName;
    business.languages = businessData.languages || business.languages;
    business.address = businessData.address || business.address;
    business.phoneNumber = businessData.phoneNumber || business.phoneNumber;
    business.city = businessData.city || business.city;
    business.state = businessData.state || business.state;
    business.country = businessData.country || business.country;
    business.bio = businessData.bio || business.bio;
    business.businessName = businessData.businessName || business.businessName;
    business.yearFounded = businessData.yearFounded || business.yearFounded;
    business.numberOfEmployee = businessData.numberOfEmployee || business.numberOfEmployee;
    business.businessAddress = businessData.businessAddress || business.businessAddress;
    business.businessCity = businessData.businessCity || business.businessCity;
    business.businessState = businessData.businessState || business.businessState;
    business.businessCountry = businessData.businessCountry || business.businessCountry;
    business.startingPrice = businessData.startingPrice || business.startingPrice;
    business.noticePeriod = businessData.noticePeriod || business.noticePeriod;
    business.businessDescription = businessData.businessDescription || business.businessDescription;
    business.currency = businessData.currency || business.currency;
    if (files['profileImage']) {
        business.profileImage = files['profileImage'][0].path;
    }
    if (files['businessImages'] && files['businessImages'].length > 0) {
        const newBusinessImages = files['businessImages'].map((file) => ({
            imageUrl: file.path,
        }));
        business.businessImages.push(...newBusinessImages);
    }
    yield business.save();
    return business;
});
exports.updateBusiness = updateBusiness;
const fetchUserBusiness = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield business_model_1.default.findOne({ userId });
});
exports.fetchUserBusiness = fetchUserBusiness;
const fetchSingleBusiness = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield business_model_1.default.findById(businessId)
        .populate('userId', 'fullName email userName uniqueId profileImage level');
});
exports.fetchSingleBusiness = fetchSingleBusiness;
const fetchSingleBusinessWithDetails = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    const business = yield business_model_1.default.findById(businessId)
        .populate('userId', 'fullName email userName uniqueId profileImage level')
        .populate('reviews', 'rating');
    if (!business) {
        return null;
    }
    const totalReviews = business.reviews.length;
    const averageRating = totalReviews > 0
        ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
    return Object.assign(Object.assign({}, business.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
});
exports.fetchSingleBusinessWithDetails = fetchSingleBusinessWithDetails;
const fetchAllBusiness = (userId, page, limit, filters, search) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.startPriceRange) {
        query.startingPrice = {
            $gte: filters.startPriceRange[0],
            $lte: filters.startPriceRange[1],
        };
    }
    if (filters.expertType) {
        query.expertType = filters.expertType;
    }
    if (filters.location) {
        query.$or = [
            { city: { $regex: filters.location, $options: 'i' } },
            { state: { $regex: filters.location, $options: 'i' } },
            { country: { $regex: filters.location, $options: 'i' } },
        ];
    }
    if (search) {
        query.$or = [];
        const businessFields = ['services', 'businessName', 'location', 'bio', 'city', 'state', 'country'];
        businessFields.forEach((field) => {
            query.$or.push({ [field]: { $regex: search, $options: 'i' } });
        });
    }
    if (filters.noticePeriod) {
        query.noticePeriod = filters.noticePeriod;
    }
    const businesses = yield business_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviews', 'rating');
    const totalBusinesses = yield business_model_1.default.countDocuments(query);
    let likedBusinessIds = [];
    let user;
    if (userId) {
        const likedBusinesses = yield businessLike_model_1.default.find({ user: userId }).select('business').lean();
        likedBusinessIds = likedBusinesses.map((like) => like.business.toString());
        user = yield userService.findUserWithoutDetailsById(userId);
    }
    const enhancedBusinesses = yield Promise.all(businesses.map((business) => __awaiter(void 0, void 0, void 0, function* () {
        const totalReviews = business.reviews.length;
        const averageRating = totalReviews > 0
            ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const completedJobs = yield projectService.completedJobsCount(String(business._id));
        return Object.assign(Object.assign({}, business.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)), isCompared: userId ? user.comparedBusinesses.includes(String(business._id)) : false, completedJobs, liked: likedBusinessIds.includes(String(business._id)) });
    })));
    const filteredBusinesses = enhancedBusinesses.filter((business) => {
        if (filters.minRating && business.averageRating < filters.minRating) {
            return false;
        }
        if (filters.minReviews && business.totalReviews < filters.minReviews) {
            return false;
        }
        return true;
    });
    return {
        business: filteredBusinesses,
        totalPages: Math.ceil(totalBusinesses / limit),
        currentPage: page,
        totalBusinesses,
    };
});
exports.fetchAllBusiness = fetchAllBusiness;
const deleteBusiness = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield business_model_1.default.findByIdAndDelete(businessId);
});
exports.deleteBusiness = deleteBusiness;
const fetchAllUserBusinessesAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield business_model_1.default.find({ userId: userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating')
        .lean();
});
exports.fetchAllUserBusinessesAdmin = fetchAllUserBusinessesAdmin;
const fetchAllComparedBusinesses = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    const businesses = yield business_model_1.default.find({ _id: { $in: businessId } })
        .populate('userId', 'fullName email userName uniqueId profileImage level gender')
        .populate('reviews', 'rating')
        .lean();
    const enhancedBusinesses = businesses.map((business) => __awaiter(void 0, void 0, void 0, function* () {
        const totalReviews = business.reviews.length;
        const averageRating = totalReviews > 0
            ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const completedJobs = yield projectService.completedJobsCount(String(business._id));
        return Object.assign(Object.assign({}, business.toObject()), { completedJobs,
            totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
    }));
    return {
        enhancedBusinesses
    };
});
exports.fetchAllComparedBusinesses = fetchAllComparedBusinesses;
const ifLikedBusiness = (businessId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield businessLike_model_1.default.findOne({ business: businessId, user: userId });
});
exports.ifLikedBusiness = ifLikedBusiness;
const createBusinessLike = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield businessLike_model_1.default.create(data);
});
exports.createBusinessLike = createBusinessLike;
const unlikeBusiness = (businessId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield businessLike_model_1.default.findOneAndDelete({ user: userId, business: businessId });
});
exports.unlikeBusiness = unlikeBusiness;
const otherBusinessesByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield business_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating');
});
exports.otherBusinessesByUser = otherBusinessesByUser;
const fetchSimilarBusinesses = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const limit = 10;
    const targetBusiness = yield business_model_1.default.findById(businessId);
    if (!targetBusiness) {
        throw new error_1.NotFoundError('Service not found');
    }
    const query = {
        _id: { $ne: businessId },
    };
    if (targetBusiness.city || targetBusiness.state || targetBusiness.country) {
        query.$or = [
            { businessCity: targetBusiness.businessCity },
            { businessState: targetBusiness.businessState },
            { businessCountry: targetBusiness.businessCountry },
        ];
    }
    ;
    if ((_a = targetBusiness.services) === null || _a === void 0 ? void 0 : _a.length) {
        query.services = { $in: targetBusiness.services };
    }
    const similarBusinesses = yield business_model_1.default.find(query)
        .limit(Number(limit))
        .populate('reviews', 'rating');
    const enhancedBusinesses = yield Promise.all(similarBusinesses.map((business) => __awaiter(void 0, void 0, void 0, function* () {
        const totalReviews = business.reviews.length;
        const averageRating = totalReviews > 0
            ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return Object.assign(Object.assign({}, business.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) });
    })));
    return enhancedBusinesses;
});
exports.fetchSimilarBusinesses = fetchSimilarBusinesses;
const fetchBusinessReviews = (businessId_1, page_1, limit_1, ...args_1) => __awaiter(void 0, [businessId_1, page_1, limit_1, ...args_1], void 0, function* (businessId, page, limit, sortBy = 'newest') {
    const business = yield business_model_1.default.findById(businessId);
    if (!business) {
        throw new error_1.NotFoundError('Service not found!');
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortCriteria = sortBy === 'mostRelevant' ? { helpfulCount: -1, createdAt: -1 } : { createdAt: -1 };
    const reviews = yield review_model_1.default.find({ businessId })
        .skip(skip)
        .limit(Number(limit))
        .sort(sortCriteria)
        .populate('userId', 'profileImage fullName userName uniqueId gender level')
        .lean();
    const allReviews = yield review_model_1.default.find({ businessId }).lean();
    const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
        acc[star] = allReviews.filter((review) => review.rating === star).length;
        return acc;
    }, {});
    const totalRatings = allReviews.length;
    const averageRating = totalRatings > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings
        : 0;
    const averageCommunicationRating = totalRatings > 0
        ? allReviews.reduce((sum, review) => sum + review.rateCommunication, 0) / totalRatings
        : 0;
    const averageIsRecommended = totalRatings > 0
        ? (allReviews.filter((review) => review.isRecommendVendor).length /
            totalRatings) *
            100
        : 0;
    const data = {
        averageRating: parseFloat(averageRating.toFixed(2)),
        averageCommunicationRating: parseFloat(averageCommunicationRating.toFixed(2)),
        serviceAsSeen: parseFloat(averageIsRecommended.toFixed(2)),
        numberOfRatings: totalRatings,
        starCounts,
        reviews,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRatings / Number(limit)),
    };
    return data;
});
exports.fetchBusinessReviews = fetchBusinessReviews;
const markReviewHelpful = (reviewId, isHelpful, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.default.findById(reviewId);
    if (!review) {
        throw new error_1.NotFoundError('Review not found.');
    }
    if (!userId) {
        review.helpfulCount += 1;
    }
    else {
        const alreadyMarked = review.helpfulUsers.find((entry) => String(entry) === String(userId));
        if (alreadyMarked) {
            throw new error_1.BadRequestError('You have already marked this review.');
        }
        review.helpfulUsers.push(userId);
        review.helpfulCount += 1;
    }
    yield review.save();
    return review;
});
exports.markReviewHelpful = markReviewHelpful;
