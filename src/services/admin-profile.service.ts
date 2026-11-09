import Admin from "../models/admin.model";
import AdminAction from "../models/admin-action.model";
import { NotFoundError } from "../errors/error";

const safeAdmin = (admin: any) => ({
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

export const fetchAdminProfile = async (adminId: string, page = 1, limit = 20, hours = 24) => {
  const admin = await Admin.findById(adminId).lean();
  if (!admin) throw new NotFoundError("Admin not found");
  const query: Record<string, unknown> = { adminId };
  if (hours > 0) query.createdAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
  const [activity, total] = await Promise.all([
    AdminAction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AdminAction.countDocuments(query),
  ]);
  return { admin: safeAdmin(admin), activity, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const updateAdminProfile = async (adminId: string, payload: Record<string, unknown>) => {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new NotFoundError("Admin not found");
  const previousState = safeAdmin(admin);
  Object.assign(admin, payload);
  await admin.save();
  await AdminAction.create({ adminId, targetType: "admin", targetId: admin._id, action: "admin.profile_updated", previousState, newState: safeAdmin(admin) });
  return safeAdmin(admin);
};

export const logAdminSignIn = async (admin: any, ip?: string, userAgent?: string) => {
  admin.lastLoginIp = ip || undefined;
  admin.lastLoginUserAgent = userAgent || undefined;
  await admin.save();
  await AdminAction.create({ adminId: admin._id, targetType: "admin", targetId: admin._id, action: "admin.signed_in", metadata: { ip: ip || null, userAgent: userAgent || null, mfa: true, outcome: "success" } });
};
