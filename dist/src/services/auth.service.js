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
exports.fetchUserMutedJobs = exports.findSpecificUser = exports.findUserByEmailOrUserName = exports.findUserByUniqueId = exports.findUserByIdWithPassword = exports.findUserByUserName = exports.updateUserById = exports.findTokenService = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findOne({ email: email });
});
exports.findUserByEmail = findUserByEmail;
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield users_model_1.default.findById(id, { password: 0 }).populate({
        path: 'businesses',
        select: 'businessId businessName',
    }).populate('wallet');
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
