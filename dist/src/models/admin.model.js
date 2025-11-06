"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_enums_1 = require("../enums/user.enums");
const adminSchema = new mongoose_1.default.Schema({
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    mobile: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    status: { type: String, enum: user_enums_1.UserStatus, default: user_enums_1.UserStatus.active },
    registrationOtp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    passwordResetOtp: { type: String },
    profileImage: { type: String },
    role: { type: String, enum: user_enums_1.AdminRolesEnum, default: user_enums_1.AdminRolesEnum.admin },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Admin', adminSchema);
