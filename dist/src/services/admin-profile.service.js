"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminSignIn = exports.updateAdminProfile = exports.fetchAdminProfile = void 0;
const admin_model_1 = __importDefault(require("../models/admin.model"));
const admin_action_model_1 = __importDefault(require("../models/admin-action.model"));
const error_1 = require("../errors/error");
const safeAdmin = (admin) => ({
    id: admin._id,
    fullName: admin.fullName || null,
    email: admin.email,
    mobile: admin.mobile || null,
    profileImage: admin.profileImage || null,
    department: admin.department,
    jobTitle: admin.jobTitle || null,
    role: admin.role,
    permissions: admin.permissions || [],
    status: admin.status,
    onlineStatus: admin.lastLoginAt && Date.now() - new Date(admin.lastLoginAt).getTime() <= 15 * 60 * 1000 ? "online" : "offline",
    lastLoginAt: admin.lastLoginAt || null,
    lastLoginIp: admin.lastLoginIp || null,
    createdAt: admin.createdAt,
});
const fetchAdminProfile = async (adminId, page = 1, limit = 20, hours = 24) => {
    const admin = await admin_model_1.default.findById(adminId).lean();
    if (!admin)
        throw new error_1.NotFoundError("Admin not found");
    const query = { adminId };
    if (hours > 0)
        query.createdAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
    const [activity, total] = await Promise.all([
        admin_action_model_1.default.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        admin_action_model_1.default.countDocuments(query),
    ]);
    return { admin: safeAdmin(admin), activity, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
exports.fetchAdminProfile = fetchAdminProfile;
const updateAdminProfile = async (adminId, payload) => {
    const admin = await admin_model_1.default.findById(adminId);
    if (!admin)
        throw new error_1.NotFoundError("Admin not found");
    const previousState = safeAdmin(admin);
    Object.assign(admin, payload);
    await admin.save();
    await admin_action_model_1.default.create({ adminId, targetType: "admin", targetId: admin._id, action: "admin.profile_updated", previousState, newState: safeAdmin(admin) });
    return safeAdmin(admin);
};
exports.updateAdminProfile = updateAdminProfile;
const logAdminSignIn = async (admin, ip, userAgent) => {
    admin.lastLoginIp = ip || undefined;
    admin.lastLoginUserAgent = userAgent || undefined;
    await admin.save();
    await admin_action_model_1.default.create({ adminId: admin._id, targetType: "admin", targetId: admin._id, action: "admin.signed_in", metadata: { ip: ip || null, userAgent: userAgent || null, mfa: true, outcome: "success" } });
};
exports.logAdminSignIn = logAdminSignIn;
