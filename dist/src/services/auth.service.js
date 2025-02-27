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
exports.findUserWithoutPhoneNumberDetailsById = exports.findUserWithoutDetailsById = exports.findUserUsingUniqueIdEmailUserId = exports.verifyUser = exports.fetchAllUsersAdmin = exports.fetchAllUsersAdminDashboard = exports.fetchUserMutedBusinesses = exports.fetchUserMutedJobs = exports.findSpecificUser = exports.findUserByEmailOrUserNameDirectJob = exports.findUserByEmailOrUserName = exports.findUserByUniqueId = exports.findUserByIdWithPassword = exports.findUserByUserName = exports.updateUserById = exports.findTokenService = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({ email: email });
});
exports.findUserByEmail = findUserByEmail;
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findById(id, { password: 0 }).populate({
        path: 'businesses',
        select: 'businessId businessName',
    }).populate('wallets')
        .populate('subscription');
});
exports.findUserById = findUserById;
const createUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.create(data);
});
exports.createUser = createUser;
const findTokenService = (registrationOtp) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield users_model_1.default.findOne({ registrationOtp: registrationOtp });
    if (!tokenData)
        return null;
    if (tokenData.otpExpiresAt && tokenData.otpExpiresAt.getTime() < Date.now()) {
        return null;
    }
    return tokenData;
});
exports.findTokenService = findTokenService;
const updateUserById = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findByIdAndUpdate(id, { $set: Object.assign({}, data) }, { new: true });
});
exports.updateUserById = updateUserById;
const findUserByUserName = (userName) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({ userName: userName });
});
exports.findUserByUserName = findUserByUserName;
const findUserByIdWithPassword = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findById(id);
});
exports.findUserByIdWithPassword = findUserByIdWithPassword;
const findUserByUniqueId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({ uniqueId: id });
});
exports.findUserByUniqueId = findUserByUniqueId;
const findUserByEmailOrUserName = (email, userName) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({ $or: [{ email }, { userName }] });
});
exports.findUserByEmailOrUserName = findUserByEmailOrUserName;
const findUserByEmailOrUserNameDirectJob = (user) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({ $or: [{ email: user }, { userName: user }] });
});
exports.findUserByEmailOrUserNameDirectJob = findUserByEmailOrUserNameDirectJob;
const findSpecificUser = (query) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({
        $or: [{ userName: query }, { email: query }],
    }).select('-password');
});
exports.findSpecificUser = findSpecificUser;
const fetchUserMutedJobs = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return users_model_1.default.findById(userId).select('mutedJobs').lean();
});
exports.fetchUserMutedJobs = fetchUserMutedJobs;
const fetchUserMutedBusinesses = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return users_model_1.default.findById(userId).select('mutedBusinesses').lean();
});
exports.fetchUserMutedBusinesses = fetchUserMutedBusinesses;
const fetchAllUsersAdminDashboard = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.countDocuments();
});
exports.fetchAllUsersAdminDashboard = fetchAllUsersAdminDashboard;
const fetchAllUsersAdmin = (page, limit, q, search) => __awaiter(void 0, void 0, void 0, function* () {
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
    const totalUsers = yield users_model_1.default.countDocuments(query);
    const users = yield users_model_1.default.find(query)
        .skip(skip)
        .limit(limit);
    return { users, totalUsers };
});
exports.fetchAllUsersAdmin = fetchAllUsersAdmin;
const verifyUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findByIdAndUpdate(userId, { $set: { isVerified: true } }, { new: true });
});
exports.verifyUser = verifyUser;
const findUserUsingUniqueIdEmailUserId = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({
        $or: [
            { _id: identifier },
            { username: identifier },
            { uniqueId: identifier },
        ],
    });
});
exports.findUserUsingUniqueIdEmailUserId = findUserUsingUniqueIdEmailUserId;
const findUserWithoutDetailsById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findById(id, { password: 0 });
});
exports.findUserWithoutDetailsById = findUserWithoutDetailsById;
const findUserWithoutPhoneNumberDetailsById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findById(id, { password: 0,
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
});
exports.findUserWithoutPhoneNumberDetailsById = findUserWithoutPhoneNumberDetailsById;
