"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserProfile = exports.buildProfilePayload = exports.getProfileContextService = exports.resolveExpertContext = exports.deleteUser = exports.findUserWithoutPhoneNumberDetailsById = exports.findUserWithoutDetailsById = exports.findUserUsingUniqueIdEmailUserId = exports.verifyUser = exports.fetchAllUsersAdmin = exports.fetchAllUsersAdminDashboard = exports.fetchUserMutedBusinesses = exports.fetchUserMutedJobs = exports.findSpecificUser = exports.findUserByEmailOrUserNameDirectJob = exports.findUserByEmailOrUserName = exports.findUserByUniqueId = exports.findUserByIdWithPassword = exports.findUserByUserName = exports.updateUserById = exports.findTokenService = exports.findCurrentUserById = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
const mongoose_1 = require("mongoose");
const validation_helper_1 = require("../helpers/validation.helper");
const error_1 = require("../errors/error");
const findUserByEmail = async (email) => {
    return await users_model_1.default.findOne({ email: email });
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    return await users_model_1.default.findById(id, { password: 0 })
        .populate('wallets')
        .populate('subscription');
};
exports.findUserById = findUserById;
const createUser = async (data) => {
    return await users_model_1.default.create(data);
};
exports.createUser = createUser;
const findCurrentUserById = async (id) => {
    return await users_model_1.default.findById(id).select("fullName uniqueId email language isProfileComplete isVerified");
};
exports.findCurrentUserById = findCurrentUserById;
const findTokenService = async (registrationOtp) => {
    const tokenData = await users_model_1.default.findOne({ registrationOtp: registrationOtp });
    if (!tokenData)
        return null;
    if (tokenData.otpExpiresAt && tokenData.otpExpiresAt.getTime() < Date.now()) {
        return null;
    }
    return tokenData;
};
exports.findTokenService = findTokenService;
const updateUserById = async (id, data) => {
    return await users_model_1.default.findByIdAndUpdate(id, { $set: { ...data } }, { new: true });
};
exports.updateUserById = updateUserById;
const findUserByUserName = async (userName) => {
    return await users_model_1.default.findOne({ userName: userName });
};
exports.findUserByUserName = findUserByUserName;
const findUserByIdWithPassword = async (id) => {
    return await users_model_1.default.findById(id);
};
exports.findUserByIdWithPassword = findUserByIdWithPassword;
const findUserByUniqueId = async (id) => {
    return await users_model_1.default.findOne({ uniqueId: id });
};
exports.findUserByUniqueId = findUserByUniqueId;
const findUserByEmailOrUserName = async (email, userName) => {
    return await users_model_1.default.findOne({ $or: [{ email }, { userName }] });
};
exports.findUserByEmailOrUserName = findUserByEmailOrUserName;
const findUserByEmailOrUserNameDirectJob = async (user) => {
    return await users_model_1.default.findOne({ $or: [{ email: user }, { userName: user }] });
};
exports.findUserByEmailOrUserNameDirectJob = findUserByEmailOrUserNameDirectJob;
const findSpecificUser = async (query) => {
    return await users_model_1.default.findOne({
        $or: [{ userName: query }, { email: query }],
    }).select('-password');
};
exports.findSpecificUser = findSpecificUser;
const fetchUserMutedJobs = async (userId) => {
    return users_model_1.default.findById(userId).select('mutedJobs').lean();
};
exports.fetchUserMutedJobs = fetchUserMutedJobs;
const fetchUserMutedBusinesses = async (userId) => {
    return users_model_1.default.findById(userId).select('mutedBusinesses').lean();
};
exports.fetchUserMutedBusinesses = fetchUserMutedBusinesses;
const fetchAllUsersAdminDashboard = async () => {
    return await users_model_1.default.countDocuments();
};
exports.fetchAllUsersAdminDashboard = fetchAllUsersAdminDashboard;
const fetchAllUsersAdmin = async (page, limit, q, search) => {
    const skip = (page - 1) * limit;
    let query = {};
    if (q === "verified") {
        query.isVerified = true;
    }
    else if (q === "requestVerification") {
        query.isVerified = false;
        query.requestedVerification = true;
    }
    if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { fullName: searchRegex },
            { email: searchRegex },
            { userName: searchRegex },
            { gender: searchRegex },
            { location: searchRegex },
            { uniqueId: searchRegex },
        ];
    }
    const totalUsers = await users_model_1.default.countDocuments(query);
    const users = await users_model_1.default.find(query)
        .skip(skip)
        .limit(limit);
    return { users, totalUsers };
};
exports.fetchAllUsersAdmin = fetchAllUsersAdmin;
const verifyUser = async (userId) => {
    return await users_model_1.default.findByIdAndUpdate(userId, { $set: { isVerified: true } }, { new: true });
};
exports.verifyUser = verifyUser;
const findUserUsingUniqueIdEmailUserId = async (identifier) => {
    return await users_model_1.default.findOne({
        $or: [
            { _id: identifier },
            { username: identifier },
            { uniqueId: identifier },
        ],
    });
};
exports.findUserUsingUniqueIdEmailUserId = findUserUsingUniqueIdEmailUserId;
const findUserWithoutDetailsById = async (id) => {
    return await users_model_1.default.findById(id, { password: 0 });
};
exports.findUserWithoutDetailsById = findUserWithoutDetailsById;
const findUserWithoutPhoneNumberDetailsById = async (id) => {
    return await users_model_1.default.findById(id, { password: 0,
        number1: 0,
        number2: 0,
        whatsAppNo: 0,
        registrationOtp: 0,
        email: 0,
        otpExpiresAt: 0,
        passwordResetOtp: 0,
        googleId: 0,
        accessToken: 0,
        businesses: 0,
        mutedJobs: 0,
        wallets: 0,
        role: 0,
        invitedUsers: 0,
        subscription: 0,
        requestedVerification: 0,
        comparedBusinesses: 0,
        comparedProducts: 0,
        accountDetails: 0,
        sharedCount: 0,
        mutedBusinesses: 0,
        isEmailVerified: 0,
        createdAt: 0,
        updatedAt: 0,
    });
};
exports.findUserWithoutPhoneNumberDetailsById = findUserWithoutPhoneNumberDetailsById;
const deleteUser = async (userId) => {
    return await users_model_1.default.findByIdAndDelete(userId);
};
exports.deleteUser = deleteUser;
const resolveExpertContext = async (userId, forceNewBusiness = false) => {
    const user = await users_model_1.default.findById(userId).select('isProfileComplete businesses');
    if (!user)
        throw new Error('User not found');
    const hasBusiness = user.businesses && user.businesses.length > 0;
    const profileComplete = user.isProfileComplete === true;
    if (!hasBusiness && !profileComplete)
        return 'FIRST_JOIN';
    if (forceNewBusiness && profileComplete)
        return 'NEW_BUSINESS';
    if (hasBusiness && !profileComplete)
        return 'SETTINGS_FIRST';
    return 'SETTINGS_UPDATE';
};
exports.resolveExpertContext = resolveExpertContext;
const getProfileContextService = async (userId, forceNewBusiness = false) => {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const context = await (0, exports.resolveExpertContext)(userObjectId, forceNewBusiness);
    let prefill = {};
    if (context === 'NEW_BUSINESS') {
        const user = await users_model_1.default.findById(userObjectId).select('firstName lastName mobile countryCode language houseAddress city state country bio displayImage');
        if (user) {
            prefill = {
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
            };
        }
    }
    return { context, prefill };
};
exports.getProfileContextService = getProfileContextService;
const pick = (v) => v !== undefined && v.trim() !== '' ? v.trim() : undefined;
const buildProfilePayload = (dto) => {
    const userSet = {};
    const businessSet = {};
    if (pick(dto.firstName)) {
        userSet.firstName = pick(dto.firstName);
        businessSet.firstName = pick(dto.firstName);
    }
    if (pick(dto.lastName)) {
        userSet.lastName = pick(dto.lastName);
        businessSet.lastName = pick(dto.lastName);
    }
    if (pick(dto.countryCode)) {
        userSet.countryCode = pick(dto.countryCode);
    }
    if (pick(dto.mobile)) {
        userSet.mobile = pick(dto.mobile);
        businessSet.phoneNumber = pick(dto.mobile);
    }
    if (pick(dto.language)) {
        userSet.language = pick(dto.language);
        businessSet.languages = [pick(dto.language)];
    }
    if (pick(dto.houseAddress)) {
        userSet.houseAddress = pick(dto.houseAddress);
        businessSet.address = pick(dto.houseAddress);
    }
    if (pick(dto.city)) {
        userSet.city = pick(dto.city);
        businessSet.city = pick(dto.city);
    }
    if (pick(dto.state)) {
        userSet.state = pick(dto.state);
        businessSet.state = pick(dto.state);
    }
    if (pick(dto.country)) {
        userSet.country = pick(dto.country);
        businessSet.country = pick(dto.country);
    }
    if (pick(dto.bio)) {
        userSet.bio = pick(dto.bio);
        businessSet.bio = pick(dto.bio);
    }
    if (pick(dto.displayImage)) {
        userSet.displayImage = pick(dto.displayImage);
        businessSet.profileImage = pick(dto.displayImage);
    }
    return { userSet, businessSet };
};
exports.buildProfilePayload = buildProfilePayload;
const saveUserProfile = async (userId, dto, files) => {
    try {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const user = await users_model_1.default.findById(userObjectId).select('isProfileComplete');
        if (!user)
            throw new error_1.NotFoundError('User not found');
        const isFirstTime = !user.isProfileComplete;
        if (isFirstTime)
            (0, validation_helper_1.assertAllProfileFieldsPresent)(dto);
        if (files && files['profileImage'] && files['profileImage'][0]) {
            dto.displayImage = files['profileImage'][0].path;
        }
        const { userSet } = (0, exports.buildProfilePayload)(dto);
        if (isFirstTime)
            userSet.isProfileComplete = true;
        const updatedUser = await users_model_1.default.findByIdAndUpdate(userObjectId, { $set: userSet }, { new: true, runValidators: true }).select('-password -registrationOtp -passwordResetOtp -otpExpiresAt');
        if (!updatedUser)
            throw new error_1.NotFoundError('User not found');
        return { isFirstTime, user: updatedUser };
    }
    catch (error) {
        console.error(`Error in saveUserProfile: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to save user profile: ${error instanceof Error ? error.message : String(error)}`);
    }
};
exports.saveUserProfile = saveUserProfile;
