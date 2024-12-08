"use strict";
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
exports.deleteBusiness = exports.fetchAllBusiness = exports.fetchSingleBusiness = exports.fetchUserBusiness = exports.updateBusiness = exports.createBusiness = void 0;
const business_model_1 = __importDefault(require("../models/business.model"));
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
    return yield business_model_1.default.findById(businessId).populate('userId', 'fullName email userName uniqueId profileImage level');
});
exports.fetchSingleBusiness = fetchSingleBusiness;
const fetchAllBusiness = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const business = yield business_model_1.default.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const totalBusinesses = yield business_model_1.default.countDocuments();
    return {
        business,
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
