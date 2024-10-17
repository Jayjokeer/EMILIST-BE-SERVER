export interface IUser {
    fullName: string;
    email: string;
    password: string;
    userName: string;
    uniqueId?: string;
    gender?: string;
    language?: string;
    number1?: string;
    number2?: string;
    whatsAppNo?: string;
    location?: string;
    bio?: string;
    membership?: object;
    isEmailVerified?: boolean;
    otpExpiresAt?: Date;
    registrationOtp?: string;
    passwordResetOtp?: String;
    profileImage?: string;
    status?: string; 
    accessToken?: string;
  }
  
export interface ICreateUser {
    email: string;
    password: string;
    userName: string;
    uniqueId: string;
}

export interface ISignUser {
  email: string,
  id: any,
  userName: string,
}