import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import { UserRolesEnum, UserStatus } from '../enums/user.enums';
import {JobExpertLevel } from "../enums/jobs.enum";

const userSchema: Schema = new mongoose.Schema(
  {
    firstName: { type: String},
    lastName: { type: String},
    countryCode: {type: String},
    email: { type: String, required: true, unique: true },
    password: { type: String },
    houseAddress: { type: String },
    userName: { type: String },
    uniqueId: { type: String, unique: true },
    gender: { type: String},
    languages: [{type: String}],
    mobile: {type: String},
    city: {type: String},
    state: {type: String},
    country: {type: String},
    bio: {type: String},
    level: {type: String, enum: JobExpertLevel, default:JobExpertLevel.one},
    membership: {
        type: mongoose.Schema.Types.Mixed,
      },
    isEmailVerified: {type: Boolean, default: false},
    status: {type: String, enum: UserStatus, default: UserStatus.active}, 
    registrationOtp: {type: String, default: null},
    otpExpiresAt: {type: Date, default: null},
    passwordResetOtp: {type: String},
    displayImage: {type: String},
    googleId: {type: String},
    accessToken: {type: String},
    businesses: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
    mutedJobs: [{ type: Schema.Types.ObjectId, ref: 'Jobs' }],
    wallets: [{ type: Schema.Types.ObjectId, ref: 'Wallet' }],
    role: {type: String, enum: UserRolesEnum, default: UserRolesEnum.user},
    isPrimeMember: {type: Boolean, default: false},
    invitedUsers: [{ type: String }],
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    isVerified: {type: Boolean, default: false},
    requestedVerification: {type: Boolean, default: false},
    comparedBusinesses:  [{ type: Schema.Types.ObjectId, ref: 'Business' }],
    comparedProducts:  [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    accountDetails: {
      number: {type: String},
      bank: {type: String},
      holdersName: {type: String},
    },
    sharedCount: {type: Number, default: 0},
    mutedBusinesses: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
    isProfileComplete: {type: Boolean, default: false},
  },
  { timestamps: true }

);

export default mongoose.model<IUser>('Users', userSchema);