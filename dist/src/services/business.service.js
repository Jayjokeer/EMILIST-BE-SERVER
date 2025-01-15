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
exports.fetchAllComparedBusinesses = exports.fetchAllUserBusinessesAdmin = exports.deleteBusiness = exports.fetchAllBusiness = exports.fetchSingleBusinessWithDetails = exports.fetchSingleBusiness = exports.fetchUserBusiness = exports.updateBusiness = exports.createBusiness = void 0;
const error_1 = require("../errors/error");
const business_model_1 = __importDefault(require("../models/business.model"));
const userService = __importStar(require("./auth.service"));
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
        const businessFields = ['services', 'businessName', 'location', 'businessName', 'bio', 'city', 'state', 'country'];
        businessFields.forEach(field => {
            query.$or.push({ [field]: { $regex: search, $options: 'i' } });
        });
    }
    if (filters.noticePeriod) {
        query.noticePeriod = filters.noticePeriod;
    }
    let user;
    if (userId) {
        user = yield userService.findUserById(userId);
        if (!user) {
            throw new error_1.NotFoundError('User not found');
        }
        ;
    }
    const comparedBusinesses = (user === null || user === void 0 ? void 0 : user.comparedBusinesses) || [];
    const businesses = yield business_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviews', 'rating');
    const totalBusinesses = yield business_model_1.default.countDocuments(query);
    const enhancedBusinesses = businesses
        .map((business) => {
        const totalReviews = business.reviews.length;
        const averageRating = totalReviews > 0
            ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        return Object.assign(Object.assign({}, business.toObject()), { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)), isCompared: comparedBusinesses.some((id) => String(id) == String(business._id)) });
    })
        .filter((business) => {
        if (filters.minRating && business.averageRating < filters.minRating) {
            return false;
        }
        if (filters.minReviews && business.totalReviews < filters.minReviews) {
            return false;
        }
        return true;
    });
    return {
        business: enhancedBusinesses,
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
    const businesses = yield business_model_1.default.find({ _id: { $in: businessId } });
    return businesses;
});
exports.fetchAllComparedBusinesses = fetchAllComparedBusinesses;
