import mongoose, { Document, Schema, Types } from 'mongoose';
import { AdminOnboardingStatus, AdminRolesEnum, UserStatus } from '../enums/user.enums';

export interface AdminDocument extends Document {
  _id: Types.ObjectId;
  fullName?: string;
  email: string;
  password?: string;
  passwordHistory: string[];
  mobile?: string;
  department: string;
  jobTitle?: string;
  permissions: string[];
  isEmailVerified: boolean;
  status: UserStatus;
  registrationOtp?: string | null;
  otpExpiresAt?: Date;
  passwordResetOtp?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  passwordResetAuthorizationHash?: string;
  passwordResetAuthorizationExpiresAt?: Date;
  profileImage?: string;
  role: AdminRolesEnum;
  onboardingStatus: AdminOnboardingStatus;
  invitationTokenHash?: string;
  invitationExpiresAt?: Date;
  invitationAcceptedAt?: Date;
  mfaSecret?: string;
  mfaEnabled: boolean;
  mfaVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
}

const adminSchema: Schema<AdminDocument> = new mongoose.Schema(
  {
    fullName: { type: String},
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    passwordHistory: { type: [String], default: [], select: false },
    mobile: {type: String},
    department: {type: String, default: 'Operations'},
    jobTitle: {type: String},
    permissions: {type: [String], default: []},
    isEmailVerified: {type: Boolean, default: false},
    status: {type: String, enum: UserStatus, default: UserStatus.active}, 
    registrationOtp: {type: String, default: null},
    otpExpiresAt: {type: Date, default: null},
    passwordResetOtp: {type: String},
    passwordResetTokenHash: {type: String, select: false},
    passwordResetExpiresAt: {type: Date, select: false},
    passwordResetAuthorizationHash: {type: String, select: false},
    passwordResetAuthorizationExpiresAt: {type: Date, select: false},
    profileImage: {type: String},
    role: {type: String, enum: AdminRolesEnum, default: AdminRolesEnum.admin},
    onboardingStatus: {
      type: String,
      enum: AdminOnboardingStatus,
      default: AdminOnboardingStatus.invited,
    },
    invitationTokenHash: {type: String, select: false},
    invitationExpiresAt: {type: Date, select: false},
    invitationAcceptedAt: {type: Date},
    mfaSecret: {type: String, select: false},
    mfaEnabled: {type: Boolean, default: false},
    mfaVerifiedAt: {type: Date},
    lastLoginAt: {type: Date},
    lastLoginIp: {type: String},
    lastLoginUserAgent: {type: String},
  },
  { timestamps: true }

);

export default mongoose.model<AdminDocument>('Admin', adminSchema);
