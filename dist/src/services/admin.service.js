"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllAdmins = exports.getAdminById = exports.getAdminByInvitationToken = exports.getAdminByPasswordResetAuthorization = exports.getAdminByPasswordResetToken = exports.createPasswordResetToken = exports.hashInvitationToken = exports.createInvitationToken = exports.getAdminForAuthentication = exports.getAdminByEmail = exports.createAdmin = void 0;
const admin_model_1 = __importDefault(require("../models/admin.model"));
const crypto_1 = require("crypto");
const createAdmin = async (payload) => {
    return await admin_model_1.default.create(payload);
};
exports.createAdmin = createAdmin;
const getAdminByEmail = async (email) => {
    return await admin_model_1.default.findOne({ email: email });
};
exports.getAdminByEmail = getAdminByEmail;
const getAdminForAuthentication = async (email) => {
    return await admin_model_1.default.findOne({ email }).select("+password +passwordHistory +mfaSecret +invitationTokenHash +invitationExpiresAt +passwordResetTokenHash +passwordResetExpiresAt +passwordResetAuthorizationHash +passwordResetAuthorizationExpiresAt");
};
exports.getAdminForAuthentication = getAdminForAuthentication;
const createInvitationToken = () => {
    const token = (0, crypto_1.randomBytes)(32).toString("base64url");
    return { token, tokenHash: (0, exports.hashInvitationToken)(token) };
};
exports.createInvitationToken = createInvitationToken;
const hashInvitationToken = (token) => (0, crypto_1.createHash)("sha256").update(token).digest("hex");
exports.hashInvitationToken = hashInvitationToken;
exports.createPasswordResetToken = exports.createInvitationToken;
const getAdminByPasswordResetToken = async (token) => {
    return await admin_model_1.default.findOne({ passwordResetTokenHash: (0, exports.hashInvitationToken)(token) })
        .select("+mfaSecret +passwordResetTokenHash +passwordResetExpiresAt");
};
exports.getAdminByPasswordResetToken = getAdminByPasswordResetToken;
const getAdminByPasswordResetAuthorization = async (token) => {
    return await admin_model_1.default.findOne({ passwordResetAuthorizationHash: (0, exports.hashInvitationToken)(token) })
        .select("+password +passwordHistory +passwordResetAuthorizationHash +passwordResetAuthorizationExpiresAt");
};
exports.getAdminByPasswordResetAuthorization = getAdminByPasswordResetAuthorization;
const getAdminByInvitationToken = async (token) => {
    return await admin_model_1.default.findOne({ invitationTokenHash: (0, exports.hashInvitationToken)(token) })
        .select("+password +passwordHistory +invitationTokenHash +invitationExpiresAt +mfaSecret");
};
exports.getAdminByInvitationToken = getAdminByInvitationToken;
const getAdminById = async (id) => {
    return await admin_model_1.default.findById({ _id: id });
};
exports.getAdminById = getAdminById;
const fetchAllAdmins = async (page, limit, search) => {
    const skip = (page - 1) * limit;
    let query = {};
    if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { fullName: searchRegex },
            { email: searchRegex },
            { status: searchRegex },
        ];
    }
    const totalAdmins = await admin_model_1.default.countDocuments(query);
    const admins = await admin_model_1.default.find(query)
        .select("-registrationOtp -otpExpiresAt -passwordResetOtp -passwordResetExpiresAt -passwordResetAuthorizationExpiresAt")
        .skip(skip)
        .limit(limit);
    return { admins, totalAdmins };
};
exports.fetchAllAdmins = fetchAllAdmins;
