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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const user_enums_1 = require("../enums/user.enums");
const jobs_enum_1 = require("../enums/jobs.enum");
const userSchema = new mongoose_1.default.Schema({
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    userName: { type: String },
    uniqueId: { type: String, unique: true },
    gender: { type: String },
    language: { type: String },
    number1: { type: String },
    number2: { type: String },
    whatsAppNo: { type: String },
    location: { type: String },
    bio: { type: String },
    level: { type: String, enum: jobs_enum_1.JobExpertLevel, default: jobs_enum_1.JobExpertLevel.one },
    membership: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    isEmailVerified: { type: Boolean, default: false },
    status: { type: String, enum: user_enums_1.UserStatus, default: user_enums_1.UserStatus.active },
    registrationOtp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    passwordResetOtp: { type: String },
    profileImage: { type: String },
    googleId: { type: String },
    accessToken: { type: String },
    businesses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Business' }],
    mutedJobs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Jobs' }],
    wallets: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Wallet' }],
    role: { type: String, enum: user_enums_1.UserRolesEnum, default: user_enums_1.UserRolesEnum.user },
    isPrimeMember: { type: Boolean, default: false },
    invitedUsers: [{ type: String }],
    subscription: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subscription' },
    isVerified: { type: Boolean, default: false },
    requestedVerification: { type: Boolean, default: false },
    comparedBusinesses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Business' }],
    comparedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    accountDetails: {
        number: { type: Number },
        bank: { type: String },
        holdersName: { type: String },
    }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Users', userSchema);
