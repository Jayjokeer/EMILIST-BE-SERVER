import Admin from "../models/admin.model";
import { createHash, randomBytes } from "crypto";

export const createAdmin = async(payload: any)=>{
   return await Admin.create(payload);
}

export const getAdminByEmail = async(email:string)=>{
    return await Admin.findOne({email: email});
}

export const getAdminForAuthentication = async(email:string)=>{
    return await Admin.findOne({email}).select("+password +passwordHistory +mfaSecret +invitationTokenHash +invitationExpiresAt +passwordResetTokenHash +passwordResetExpiresAt +passwordResetAuthorizationHash +passwordResetAuthorizationExpiresAt");
}

export const createInvitationToken = () => {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
};

export const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createPasswordResetToken = createInvitationToken;

export const getAdminByPasswordResetToken = async(token: string)=>{
  return await Admin.findOne({ passwordResetTokenHash: hashInvitationToken(token) })
    .select("+mfaSecret +passwordResetTokenHash +passwordResetExpiresAt");
}

export const getAdminByPasswordResetAuthorization = async(token: string)=>{
  return await Admin.findOne({ passwordResetAuthorizationHash: hashInvitationToken(token) })
    .select("+password +passwordHistory +passwordResetAuthorizationHash +passwordResetAuthorizationExpiresAt");
}

export const getAdminByInvitationToken = async(token: string)=>{
  return await Admin.findOne({ invitationTokenHash: hashInvitationToken(token) })
    .select("+password +passwordHistory +invitationTokenHash +invitationExpiresAt +mfaSecret");
}

export const getAdminById = async(id: string)=>{
    return await Admin.findById({_id: id})
}

export const fetchAllAdmins = async(page: number, limit: number, search: string)=>{
  const skip = (page - 1) * limit;
  let query: any = {};
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { status: searchRegex },
    ];
  }
  const totalAdmins = await Admin.countDocuments(query);

  const admins = await Admin.find(query)
    .select("-registrationOtp -otpExpiresAt -passwordResetOtp -passwordResetExpiresAt -passwordResetAuthorizationExpiresAt")
    .skip(skip)
    .limit(limit)
    return {admins, totalAdmins}
  };
