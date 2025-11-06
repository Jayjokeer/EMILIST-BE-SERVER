import mongoose, { Document, Schema } from 'mongoose';
import { AdminRolesEnum, UserRolesEnum, UserStatus } from '../enums/user.enums';

const adminSchema: Schema = new mongoose.Schema(
  {
    fullName: { type: String},
    email: { type: String, required: true, unique: true },
    password: { type: String },
    mobile: {type: String},
    isEmailVerified: {type: Boolean, default: false},
    status: {type: String, enum: UserStatus, default: UserStatus.active}, 
    registrationOtp: {type: String, default: null},
    otpExpiresAt: {type: Date, default: null},
    passwordResetOtp: {type: String},
    profileImage: {type: String},
    role: {type: String, enum: AdminRolesEnum, default: AdminRolesEnum.admin},
  },
  { timestamps: true }

);

export default mongoose.model('Admin', adminSchema);