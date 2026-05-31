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
exports.createBusinessProfileService = exports.setupService = exports.deleteBusinessItem = exports.verifyCertificateAdmin = exports.verifyBusinessAdmin = exports.fetchAllLikedBusinesses = exports.markReviewHelpful = exports.fetchBusinessReviews = exports.fetchSimilarBusinesses = exports.otherBusinessesByUser = exports.unlikeBusiness = exports.createBusinessLike = exports.ifLikedBusiness = exports.fetchAllComparedBusinesses = exports.fetchAllUserBusinessesAdmin = exports.deleteBusiness = exports.fetchAllBusiness = exports.fetchSingleBusinessWithDetails = exports.fetchSingleBusiness = exports.fetchUserBusiness = exports.updateBusiness = exports.createBusiness = void 0;
const error_1 = require("../errors/error");
const business_model_1 = __importDefault(require("../models/business.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const userService = __importStar(require("./auth.service"));
const projectService = __importStar(require("../services/project.service"));
const businessLike_model_1 = __importDefault(require("../models/businessLike.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const project_enum_1 = require("../enums/project.enum");
const mongoose_1 = require("mongoose");
const users_model_1 = __importDefault(require("../models/users.model"));
const validation_helper_1 = require("../helpers/validation.helper");
const createBusiness = async (data) => {
    return await business_model_1.default.create(data);
};
exports.createBusiness = createBusiness;
const updateBusiness = async (businessId, businessData, files) => {
    try {
        const business = await business_model_1.default.findById(businessId);
        if (!business)
            throw new error_1.NotFoundError('Business not found');
        if (businessData.renderedServices) {
            businessData.renderedServices.forEach((newService) => {
                const existingServiceIndex = business.renderedServices.findIndex((service) => String(service._id) == String(newService.id));
                if (existingServiceIndex !== -1) {
                    business.renderedServices[existingServiceIndex] = {
                        ...business.renderedServices[existingServiceIndex],
                        ...newService,
                    };
                }
                else {
                    business.renderedServices.push(newService);
                }
            });
        }
        if (businessData.certification) {
            businessData.certification.forEach((newCert) => {
                const certId = newCert.id || newCert._id;
                const existingCert = business.certification.find((cert) => String(cert._id) === String(certId));
                let certificatePath;
                if (files?.certificate) {
                    certificatePath = Array.isArray(files.certificate)
                        ? files.certificate[0]?.path
                        : files.certificate?.path;
                }
                if (existingCert) {
                    if (certificatePath) {
                        existingCert.certificate = certificatePath;
                    }
                    existingCert.issuingOrganisation =
                        newCert.issuingOrganisation || existingCert.issuingOrganisation;
                    existingCert.verificationNumber =
                        newCert.verificationNumber || existingCert.verificationNumber;
                    existingCert.issuingDate =
                        newCert.issuingDate || existingCert.issuingDate;
                    existingCert.expiringDate =
                        newCert.expiringDate || existingCert.expiringDate;
                    // use ?? to avoid overriding false
                    existingCert.isCertificateExpire =
                        newCert.isCertificateExpire ?? existingCert.isCertificateExpire;
                }
                else {
                    business.certification.push({
                        ...newCert,
                        certificate: certificatePath || null,
                    });
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
                    existingMembership.isMembershipExpire =
                        newMembership.isMembershipExpire ?? existingMembership.isMembershipExpire;
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
        if (files?.displayImage) {
            business.displayImage = files.displayImage[0].path;
        }
        if (files?.businessImages?.length > 0) {
            const newBusinessImages = files.businessImages.map((file) => ({
                imageUrl: file.path,
            }));
            business.businessImages.push(...newBusinessImages);
        }
        await business.save();
        return business;
    }
    catch (error) {
        console.error('Error updating business:', error);
        throw new error_1.BadRequestError('Failed to update business. ' + error.message);
    }
};
exports.updateBusiness = updateBusiness;
const fetchUserBusiness = async (userId) => {
    return await business_model_1.default.findOne({ userId });
};
exports.fetchUserBusiness = fetchUserBusiness;
const fetchSingleBusiness = async (businessId) => {
    return await business_model_1.default.findById(businessId)
        .populate('userId', 'fullName email userName uniqueId profileImage level');
};
exports.fetchSingleBusiness = fetchSingleBusiness;
const fetchSingleBusinessWithDetails = async (businessId) => {
    const business = await business_model_1.default.findById(businessId)
        .populate('userId', 'fullName email userName uniqueId profileImage level')
        .populate('reviews', 'rating');
    if (!business) {
        return null;
    }
    const reviews = business.reviews || [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
    const totalJobs = await project_model_1.default.countDocuments({ user: business.userId,
        status: { $nin: [project_enum_1.ProjectStatusEnum.pending, project_enum_1.ProjectStatusEnum.rejected] }
    });
    const successfulJobs = await project_model_1.default.countDocuments({ user: business.userId, status: project_enum_1.ProjectStatusEnum.completed });
    const unsuccessfulJobs = await project_model_1.default.countDocuments({ user: business.userId, status: project_enum_1.ProjectStatusEnum.cancelled });
    const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
    return {
        ...business.toObject(),
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalJobs,
        successfulJobs,
        unsuccessfulJobs,
        successRate,
    };
};
exports.fetchSingleBusinessWithDetails = fetchSingleBusinessWithDetails;
const fetchAllBusiness = async (userId, page, limit, filters, search) => {
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
    if (filters.currency) {
        query.currency = filters.currency;
    }
    if (filters.location) {
        query.$or = [
            { city: { $regex: filters.location, $options: 'i' } },
            { state: { $regex: filters.location, $options: 'i' } },
            { country: { $regex: filters.location, $options: 'i' } },
        ];
    }
    if (search) {
        const words = search.split(/\s+/).filter(Boolean);
        const businessFields = [
            'services',
            'businessName',
            'location',
            'bio',
            'city',
            'state',
            'country',
            'user.userName',
            'user.fullName',
        ];
        query.$and = words.map((word) => {
            const regex = new RegExp(word, 'i');
            return {
                $or: businessFields.map((field) => ({
                    [field]: { $regex: regex },
                })),
            };
        });
    }
    if (filters.noticePeriod) {
        query.noticePeriod = filters.noticePeriod;
    }
    if (userId) {
        const user = await userService.fetchUserMutedBusinesses(userId);
        if (user && user.mutedBusinesses && user.mutedBusinesses.length > 0) {
            query._id = { $nin: user.mutedBusinesses };
        }
    }
    const businesses = await business_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviews', 'rating')
        .populate('userId', 'userName fullName');
    const totalBusinesses = await business_model_1.default.countDocuments(query);
    let likedBusinessIds = [];
    let user;
    if (userId) {
        const likedBusinesses = await businessLike_model_1.default.find({ user: userId }).select('business').lean();
        likedBusinessIds = likedBusinesses.map((like) => like.business.toString());
        user = await userService.findUserWithoutDetailsById(userId);
    }
    const enhancedBusinesses = await Promise.all(businesses.map(async (business) => {
        const reviews = business.reviews || [];
        console.log(business.reviews);
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const completedJobs = await projectService.completedJobsCount(String(business._id));
        return {
            ...business.toObject(),
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
            isCompared: userId ? user.comparedBusinesses.includes(String(business._id)) : false,
            completedJobs,
            liked: likedBusinessIds.includes(String(business._id)),
        };
    }));
    console.log(enhancedBusinesses);
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
};
exports.fetchAllBusiness = fetchAllBusiness;
const deleteBusiness = async (businessId) => {
    return await business_model_1.default.findByIdAndDelete(businessId);
};
exports.deleteBusiness = deleteBusiness;
const fetchAllUserBusinessesAdmin = async (userId) => {
    return await business_model_1.default.find({ userId: userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating')
        .lean();
};
exports.fetchAllUserBusinessesAdmin = fetchAllUserBusinessesAdmin;
const fetchAllComparedBusinesses = async (businessId) => {
    const businesses = await business_model_1.default.find({ _id: { $in: businessId } })
        .populate('userId', 'fullName email userName uniqueId profileImage level gender')
        .populate('reviews', 'rating').lean();
    const enhancedBusinesses = await Promise.all(businesses.map(async (business) => {
        const reviews = business.reviews || [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const completedJobs = await projectService.completedJobsCount(String(business._id));
        return {
            ...business,
            completedJobs,
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
        };
    }));
    return {
        enhancedBusinesses
    };
};
exports.fetchAllComparedBusinesses = fetchAllComparedBusinesses;
const ifLikedBusiness = async (businessId, userId) => {
    return await businessLike_model_1.default.findOne({ business: businessId, user: userId });
};
exports.ifLikedBusiness = ifLikedBusiness;
const createBusinessLike = async (data) => {
    return await businessLike_model_1.default.create(data);
};
exports.createBusinessLike = createBusinessLike;
const unlikeBusiness = async (businessId, userId) => {
    return await businessLike_model_1.default.findOneAndDelete({ user: userId, business: businessId });
};
exports.unlikeBusiness = unlikeBusiness;
const otherBusinessesByUser = async (userId) => {
    return await business_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('reviews', 'rating');
};
exports.otherBusinessesByUser = otherBusinessesByUser;
const fetchSimilarBusinesses = async (businessId) => {
    const limit = 10;
    const targetBusiness = await business_model_1.default.findById(businessId);
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
    if (targetBusiness.services?.length) {
        query.services = { $in: targetBusiness.services };
    }
    const similarBusinesses = await business_model_1.default.find(query)
        .limit(Number(limit))
        .populate('reviews', 'rating');
    const enhancedBusinesses = await Promise.all(similarBusinesses.map(async (business) => {
        const reviews = business.reviews || [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return {
            ...business.toObject(),
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
        };
    }));
    return enhancedBusinesses;
};
exports.fetchSimilarBusinesses = fetchSimilarBusinesses;
const fetchBusinessReviews = async (businessId, page, limit, sortBy = 'newest') => {
    const business = await business_model_1.default.findById(businessId);
    if (!business) {
        throw new error_1.NotFoundError('Service not found!');
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortCriteria = sortBy === 'mostRelevant' ? { helpfulCount: -1, createdAt: -1 } : { createdAt: -1 };
    const reviews = await review_model_1.default.find({ businessId })
        .skip(skip)
        .limit(Number(limit))
        .sort(sortCriteria)
        .populate('userId', 'profileImage fullName userName uniqueId gender level')
        .lean();
    const allReviews = await review_model_1.default.find({ businessId }).lean();
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
};
exports.fetchBusinessReviews = fetchBusinessReviews;
const markReviewHelpful = async (reviewId, isHelpful, userId) => {
    const review = await review_model_1.default.findById(reviewId);
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
    await review.save();
    return review;
};
exports.markReviewHelpful = markReviewHelpful;
const fetchAllLikedBusinesses = async (userId) => {
    const likedBusinesses = await businessLike_model_1.default.countDocuments({ user: userId });
    return {
        totalLikedBusinesses: likedBusinesses,
    };
};
exports.fetchAllLikedBusinesses = fetchAllLikedBusinesses;
const verifyBusinessAdmin = async (id) => {
    const business = await business_model_1.default.findById(id);
    if (!business) {
        throw new error_1.NotFoundError('business not found');
    }
    business.isVerified = true;
    await business.save();
};
exports.verifyBusinessAdmin = verifyBusinessAdmin;
const verifyCertificateAdmin = async (businessId, certificateId) => {
    const business = await business_model_1.default.findById(businessId);
    if (!business) {
        throw new error_1.NotFoundError('business not found');
    }
    const certificate = business.certification.find((cert) => cert._id.toString() === certificateId.toString());
    if (!certificate) {
        throw new error_1.NotFoundError("Certificate not found for this business");
    }
    const now = new Date();
    if (certificate.expiringDate && certificate.expiringDate < now) {
        certificate.isCertificateExpire = true;
        certificate.isVerified = false;
    }
    else {
        certificate.isCertificateExpire = false;
        certificate.isVerified = true;
    }
    await business.save();
    return {
        message: certificate.isVerified
            ? "Certificate successfully verified"
            : "Certificate has expired and cannot be verified",
        certificate,
    };
};
exports.verifyCertificateAdmin = verifyCertificateAdmin;
const deleteBusinessItem = async (businessId, itemType, itemId, userId) => {
    const business = await business_model_1.default.findOne({ _id: businessId, userId });
    if (!business) {
        throw new error_1.NotFoundError("Business not found or not owned by the user");
    }
    switch (itemType) {
        case "certificate": {
            const cert = business.certification.id(itemId);
            if (!cert)
                throw new error_1.NotFoundError("Certificate not found");
            cert.deleteOne();
            await business.save();
            return business;
        }
        case "certificateImage": {
            const cert = business.certification.id(itemId);
            if (!cert)
                throw new error_1.NotFoundError("Certificate not found");
            cert.certificate = undefined;
            await business.save();
            return business;
        }
        case "membership": {
            const membership = business.membership.id(itemId);
            if (!membership)
                throw new error_1.NotFoundError("Membership not found");
            membership.deleteOne();
            await business.save();
            return business;
        }
        case "insurance": {
            const insurance = business.insurance.id(itemId);
            if (!insurance)
                throw new error_1.NotFoundError("Insurance not found");
            insurance.deleteOne();
            await business.save();
            return business;
        }
        default:
            throw new error_1.BadRequestError("Invalid itemType provided");
    }
};
exports.deleteBusinessItem = deleteBusinessItem;
const setupService = async (userId, businessId, dto, files) => {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    (0, validation_helper_1.assertServiceFieldsPresent)(dto);
    let businessImages = [];
    let profileImage;
    if (files?.profileImage?.[0]) {
        profileImage = files.profileImage[0].path;
    }
    if (files?.businessImages?.length) {
        businessImages = files.businessImages.map((file) => ({
            imageUrl: file.path,
        }));
    }
    const certifications = dto.certifications ?? [];
    if (files?.certificate?.length && certifications.length) {
        certifications.forEach((cert, index) => {
            if (!cert.certificate && files.certificate[index]) {
                cert.certificate = files.certificate[index].path;
            }
        });
    }
    const serviceSet = {
        services: dto.services,
        coverageArea: dto.coverageArea,
        businessName: dto.businessName.trim(),
        yearFounded: dto.yearFounded.trim(),
        numberOfEmployee: dto.numberOfEmployee,
        businessAddress: dto.businessAddress.trim(),
        businessState: dto.businessState.trim(),
        businessCountry: dto.businessCountry.trim(),
        startingPrice: dto.startingPrice,
        currency: dto.currency.trim(),
        rateUnit: dto.rateUnit.trim(),
        noticePeriod: dto.noticePeriod.trim(),
        businessDescription: dto.businessDescription.trim(),
        certification: certifications,
        membership: dto.memberships ?? [],
        insurance: dto.insurances ?? [],
        ...(businessImages.length > 0 && { businessImages }),
        ...(profileImage && { profileImage }),
    };
    const business = await business_model_1.default.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(businessId), userId: userObjectId }, { $set: serviceSet }, { new: true, runValidators: true });
    if (!business)
        throw new error_1.NotFoundError('Business not found');
    return business;
};
exports.setupService = setupService;
const createBusinessProfileService = async (userId, dto, files) => {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const user = await users_model_1.default.findById(userObjectId).select('isProfileComplete firstName lastName mobile countryCode language houseAddress city state country bio displayImage');
    if (!user)
        throw new error_1.NotFoundError('User not found');
    let businessSet;
    if (!user.isProfileComplete) {
        if (!dto.profile) {
            throw new error_1.BadRequestError('Profile data is required to complete setup');
        }
        (0, validation_helper_1.assertAllProfileFieldsPresent)(dto.profile);
        const payloads = userService.buildProfilePayload(dto.profile);
        if (files?.displayImage?.[0]) {
            payloads.userSet.displayImage = files.displayImage[0].path;
            payloads.businessSet.displayImage = files.displayImage[0].path;
        }
        await users_model_1.default.findByIdAndUpdate(userObjectId, {
            $set: {
                ...payloads.userSet,
                isProfileComplete: true,
            },
        }, { runValidators: true });
        businessSet = payloads.businessSet;
    }
    else {
        const { businessSet: fromUser } = userService.buildProfilePayload({
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            countryCode: user.countryCode,
            language: user.language,
            houseAddress: user.houseAddress,
            city: user.city,
            state: user.state,
            country: user.country,
            bio: user.bio,
            displayImage: user.displayImage,
        });
        businessSet = fromUser;
    }
    const business = await business_model_1.default.create({
        userId: userObjectId,
        ...businessSet,
    });
    await users_model_1.default.findByIdAndUpdate(userObjectId, {
        $addToSet: { businesses: business._id },
    });
    const serviceDto = dto.business;
    const setupResult = await (0, exports.setupService)(userId, business._id.toString(), serviceDto, files);
    return {
        profileCreated: !user.isProfileComplete,
        business,
        service: setupResult,
    };
};
exports.createBusinessProfileService = createBusinessProfileService;
