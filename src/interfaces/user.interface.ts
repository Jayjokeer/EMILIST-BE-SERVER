import { JobExpertLevel } from "../enums/jobs.enum";
import { UserRolesEnum } from "../enums/user.enums";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userName: string;
    uniqueId?: string;
    gender?: string;
    language?: string;
    houseAddress?: string;
    countryCode?: string;
    mobile?: string;
    city?: string;
    bio?: string;
    state?: string;
    country?: string;
    membership?: object;
    isEmailVerified?: boolean;
    otpExpiresAt?: Date;
    registrationOtp?: string;
    passwordResetOtp?: String;
    displayImage?: string;
    status?: string; 
    accessToken?: string;
    businesses?: any;
    mutedJobs?: any;
    wallets?:any;
    role?: UserRolesEnum;
    isPrimeMember: boolean;
    invitedUsers?: string[]; 
    subscription?: any;
    createdAt?: Date;
    isVerified?: boolean;
    requestedVerification?: boolean;
    level: JobExpertLevel;
    comparedBusinesses? : any;
    accountDetails?: any;
    comparedProducts?: any;
    sharedCount?: number;
    mutedBusinesses?: any;
    isProfileComplete?: boolean;
  }
  
export interface ICreateUser {
    email: string;
    password?: string;
    uniqueId: string;
}

export interface ISignUser {
  email: string,
  id: any,
}