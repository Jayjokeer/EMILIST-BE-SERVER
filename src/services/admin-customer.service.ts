import { createHash, randomBytes } from "crypto";
import mongoose, { Types } from "mongoose";
import Users from "../models/users.model";
import Wallet from "../models/wallet.model";
import Business from "../models/business.model";
import Jobs from "../models/jobs.model";
import Project from "../models/project.model";
import Product from "../models/product.model";
import Order from "../models/order.model";
import Transaction from "../models/transaction.model";
import Subscription from "../models/subscription.model";
import Plan from "../models/plan.model";
import Review from "../models/review.model";
import AdminAction from "../models/admin-action.model";
import { BadRequestError, NotFoundError } from "../errors/error";
import { AdminCustomerAction, CustomerSuspensionType } from "../enums/admin-customer.enum";
import { PaymentMethodEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import { UserStatus } from "../enums/user.enums";
import { generateShortUUID } from "../utils/utility";
import { PlanEnum } from "../enums/plan.enum";

export const customerPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(1, Number(pageValue) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

export const customerTransactionDirection = (transaction: any, customerId: string) =>
  String(transaction.recieverId || "") === customerId && String(transaction.userId || "") !== customerId
    ? "inflow"
    : transaction.type === TransactionType.CREDIT ? "inflow" : "outflow";

export const walletBalanceChangePercentage = (currentBalance: number, previousBalance?: number | null) =>
  previousBalance && Number.isFinite(previousBalance)
    ? Number((((currentBalance - previousBalance) / previousBalance) * 100).toFixed(2))
    : 0;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const objectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Customer not found");
  return new Types.ObjectId(id);
};

export const requireCustomer = async (id: string) => {
  const user = await Users.findById(objectId(id)).select("-password -registrationOtp -passwordResetOtp -otpExpiresAt -accessToken -googleId");
  if (!user) throw new NotFoundError("Customer not found");
  return user;
};

const customerName = (user: any) => [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || null;
const serializeCustomer = (user: any) => ({
  id: user._id,
  uniqueId: user.uniqueId,
  fullName: customerName(user),
  firstName: user.firstName || null,
  middleName: user.middleName || null,
  lastName: user.lastName || null,
  username: user.userName || null,
  email: user.email,
  countryCode: user.countryCode || null,
  mobile: user.mobile || null,
  businessMobile: user.businessMobile || null,
  whatsAppNumber: user.whatsAppNumber || null,
  homeAddress: user.houseAddress || null,
  city: user.city || null,
  state: user.state || null,
  country: user.country || null,
  gender: user.gender || null,
  languages: user.languages || [],
  bio: user.bio || null,
  displayImage: user.displayImage || null,
  isVerified: Boolean(user.isVerified),
  profileComplete: Boolean(user.isProfileComplete),
  status: user.status,
  suspension: user.suspension || null,
  dateJoined: user.createdAt,
});

export const fetchCustomerSummary = async () => {
  const [activeCustomers, pendingKyc, inactiveCustomers, expertIds, merchantIds, totalCustomers] = await Promise.all([
    Users.countDocuments({ status: UserStatus.active }),
    Users.countDocuments({ isVerified: false, requestedVerification: true }),
    Users.countDocuments({ status: UserStatus.deactivated }),
    Business.distinct("userId"),
    Product.distinct("userId", { isDeleted: false }),
    Users.countDocuments(),
  ]);
  return {
    totalCustomers,
    activeCustomers,
    pendingKyc,
    inactiveCustomers,
    experts: expertIds.filter(Boolean).length,
    merchants: merchantIds.filter(Boolean).length,
  };
};

export const fetchCustomers = async (filters: any) => {
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const query: any = {};
  const normalizedStatus = String(filters.status || "").toLowerCase();
  if (normalizedStatus === "active") query.status = UserStatus.active;
  if (normalizedStatus === "inactive") query.status = UserStatus.deactivated;
  if (normalizedStatus === "suspended") query.status = UserStatus.suspended;
  if (String(filters.kyc || "").toLowerCase() === "pending") {
    query.isVerified = false;
    query.requestedVerification = true;
  }
  if (filters.profileComplete !== undefined) query.isProfileComplete = String(filters.profileComplete) === "true";

  if (filters.type === "expert") query._id = { $in: await Business.distinct("userId") };
  if (filters.type === "merchant") query._id = { $in: await Product.distinct("userId", { isDeleted: false }) };

  if (String(filters.search || "").trim()) {
    const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
    query.$or = [
      { firstName: regex }, { lastName: regex }, { userName: regex },
      { email: regex }, { uniqueId: regex }, { mobile: regex }, { houseAddress: regex },
    ];
  }

  const [users, total] = await Promise.all([
    Users.find(query).select("-password -registrationOtp -passwordResetOtp -otpExpiresAt -accessToken -googleId")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Users.countDocuments(query),
  ]);
  return { customers: users.map(serializeCustomer), total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const fetchCustomerOverview = async (id: string) => {
  const user = await requireCustomer(id);
  const userId = objectId(id);
  const [wallets, businesses] = await Promise.all([
    Wallet.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean(),
    Business.find({ userId }).select("services reviews").lean(),
  ]);
  const wallet = wallets.find((entry: any) => entry.isDefault) || wallets[0] || null;
  const earliestPeriodTransaction = wallet ? await Transaction.findOne({
      $or: [{ userId }, { recieverId: userId }],
      walletId: wallet._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      balanceBefore: { $exists: true },
    }).sort({ createdAt: 1 }).select("balanceBefore").lean() : null;
  const businessIds = businesses.map((business: any) => business._id);
  const rating = businessIds.length ? await Review.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]) : [];
  const balanceBefore = Number((earliestPeriodTransaction as any)?.balanceBefore);
  const balanceChangePercentage = wallet ? walletBalanceChangePercentage(wallet.balance, balanceBefore) : 0;
  const tags = [...new Set(businesses.flatMap((business: any) => business.services || []))];
  return {
    customer: serializeCustomer(user),
    rating: { average: Number((rating[0]?.average || 0).toFixed(2)), count: rating[0]?.count || 0 },
    tags,
    wallet: wallet ? {
      id: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency,
      isDefault: wallet.isDefault,
      balanceChangePercentage,
    } : null,
    wallets,
  };
};

export const fetchCustomerDetails = async (id: string) => {
  const user = await requireCustomer(id);
  const business = await Business.findOne({ userId: objectId(id) }).select("phoneNumber").lean();
  return {
    ...serializeCustomer(user),
    businessMobile: user.businessMobile || business?.phoneNumber || null,
  };
};

export const fetchCustomerServices = async (id: string) => {
  await requireCustomer(id);
  const businesses = await Business.find({ userId: objectId(id) }).populate("reviews", "rating").lean();
  return Promise.all(businesses.map(async (business: any) => {
    const ratings = (business.reviews || []).map((review: any) => Number(review.rating)).filter(Number.isFinite);
    const [jobsCompleted, totalProjects, earnings] = await Promise.all([
      Project.countDocuments({ businessId: business._id, status: "completed" }),
      Project.countDocuments({ businessId: business._id }),
      Transaction.aggregate([
        { $match: { recieverId: objectId(id), status: TransactionEnum.completed } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    return {
      ...business,
      metrics: {
        jobsCompleted,
        totalEarnings: earnings[0]?.total || 0,
        rating: ratings.length ? Number((ratings.reduce((sum: number, value: number) => sum + value, 0) / ratings.length).toFixed(2)) : 0,
        jobCompletionRate: totalProjects ? Number(((jobsCompleted / totalProjects) * 100).toFixed(2)) : 0,
      },
    };
  }));
};

export const fetchCustomerJobs = async (id: string, filters: any) => {
  await requireCustomer(id);
  const userId = objectId(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const applications = await Project.find({ user: userId }).select("job status").lean();
  const applicationStatus = new Map(applications.map((item: any) => [String(item.job), item.status]));
  const query: any = { $or: [{ userId }, { _id: { $in: applications.map((item: any) => item.job) } }] };
  if (filters.status) query.status = filters.status;
  if (String(filters.search || "").trim()) {
    const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
    query.$and = [{ $or: [{ title: regex }, { category: regex }, { jobCategory: regex }] }];
  }
  const [jobs, total] = await Promise.all([
    Jobs.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Jobs.countDocuments(query),
  ]);
  return {
    jobs: jobs.map((job: any) => ({
      ...job,
      role: String(job.userId) === id ? "owner" : "applicant",
      applicationStatus: applicationStatus.get(String(job._id)) || null,
    })), total, page, limit, totalPages: Math.ceil(total / limit),
  };
};

export const fetchCustomerListings = async (id: string, filters: any) => {
  await requireCustomer(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const query: any = { userId: objectId(id), isDeleted: false };
  if (filters.status) query.status = filters.status;
  if (String(filters.search || "").trim()) {
    const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
    query.$or = [{ name: regex }, { brand: regex }, { storeName: regex }, { subCategory: regex }];
  }
  const [listings, total] = await Promise.all([
    Product.find(query).populate("category", "name slug").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ]);
  return {
    listings: listings.map((listing: any) => ({
      ...listing,
      displayStatus: listing.status === "sold_out" || listing.availableQuantity <= 0
        ? "out_of_stock"
        : listing.minimumOrder && listing.availableQuantity <= listing.minimumOrder
          ? "low_stock"
          : listing.status === "active" ? "listed" : listing.status,
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  };
};

export const fetchCustomerOrders = async (id: string, filters: any) => {
  await requireCustomer(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const query: any = { userId: objectId(id) };
  if (filters.status) query.deliveryStatus = filters.status;
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);
  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const fetchCustomerSales = async (id: string, filters: any) => {
  await requireCustomer(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const userId = objectId(id);
  const match: any = { "products.merchantId": userId };
  if (filters.status) match.deliveryStatus = filters.status;
  const pipeline: any[] = [
    { $match: match }, { $unwind: "$products" }, { $match: { "products.merchantId": userId } },
    { $sort: { createdAt: -1 } },
  ];
  if (String(filters.search || "").trim()) {
    const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
    pipeline.push({ $match: { $or: [{ "products.productName": regex }, { "products.merchantName": regex }, { shippingAddress: regex }] } });
  }
  pipeline.push({ $facet: { rows: [{ $skip: skip }, { $limit: limit }], count: [{ $count: "total" }] } });
  const [result] = await Order.aggregate(pipeline);
  const total = result?.count?.[0]?.total || 0;
  return { sales: result?.rows || [], total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const fetchCustomerTransactions = async (id: string, filters: any) => {
  await requireCustomer(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const userId = objectId(id);
  const conditions: any[] = [{ $or: [{ userId }, { recieverId: userId }] }];
  if (filters.status) conditions.push({ status: filters.status });
  if (filters.type === "inflow") conditions.push({
    $or: [{ userId, type: TransactionType.CREDIT }, { recieverId: userId }],
  });
  if (filters.type === "outflow") conditions.push({ userId, type: TransactionType.DEBIT });
  if (String(filters.search || "").trim()) {
    const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
    conditions.push({ $or: [{ reference: regex }, { counterparty: regex }, { description: regex }] });
  }
  const query = { $and: conditions };
  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query),
  ]);
  return {
    transactions: transactions.map((transaction: any) => ({
      ...transaction,
      direction: customerTransactionDirection(transaction, id),
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  };
};

export const fetchCustomerSubscriptions = async (id: string, filters: any) => {
  await requireCustomer(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const userId = objectId(id);
  const [subscriptions, total, plans, receipts] = await Promise.all([
    Subscription.find({ userId }).populate("planId", "name price duration isActive").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscription.countDocuments({ userId }),
    Plan.find().sort({ price: 1 }).lean(),
    Transaction.find({ userId, serviceType: ServiceEnum.subscription }).select("planId amount status transferReceipt createdAt dateCompleted reference").sort({ createdAt: -1 }).lean(),
  ]);
  return { subscriptions, plans, receipts, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createCustomer = async (payload: any, adminId: string) => {
  const email = payload.email.toLowerCase().trim();
  if (await Users.exists({ email })) throw new BadRequestError("A customer with this email already exists");
  if (await Users.exists({ userName: payload.userName })) throw new BadRequestError("This username is already in use");
  const user = await Users.create({
    ...payload,
    email,
    uniqueId: generateShortUUID(),
    languages: payload.languages || [],
    isProfileComplete: Boolean(payload.firstName && payload.lastName && payload.mobile && payload.houseAddress),
  });
  const wallet = await Wallet.create({ userId: user._id, currency: WalletEnum.NGN, isDefault: true });
  user.wallets.push(wallet._id as any);
  const plan = await Plan.findOne({ name: PlanEnum.basic });
  if (plan) {
    const subscription = await Subscription.create({ userId: user._id, planId: plan._id, startDate: new Date(), perks: plan.perks });
    user.subscription = subscription._id as any;
  }
  await user.save();
  await AdminAction.create({ adminId, targetUserId: user._id, action: AdminCustomerAction.customerCreated, newState: serializeCustomer(user) });
  return user;
};

export const updateCustomerProfile = async (id: string, payload: any, adminId: string) => {
  const user = await requireCustomer(id);
  const previousState = serializeCustomer(user);
  Object.assign(user, payload);
  await user.save();
  await AdminAction.create({ adminId, targetUserId: user._id, action: AdminCustomerAction.profileUpdated, previousState, newState: serializeCustomer(user) });
  return serializeCustomer(user);
};

export const createCustomerPasswordReset = async (id: string, adminId: string) => {
  const user = await requireCustomer(id);
  const token = randomBytes(32).toString("base64url");
  user.adminPasswordResetTokenHash = createHash("sha256").update(token).digest("hex");
  user.adminPasswordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  await AdminAction.create({ adminId, targetUserId: user._id, action: AdminCustomerAction.passwordResetTriggered, metadata: { expiresAt: user.adminPasswordResetExpiresAt } });
  return { user, token, expiresAt: user.adminPasswordResetExpiresAt };
};

export const suspendCustomer = async (id: string, payload: any, adminId: string) => {
  const user = await requireCustomer(id);
  const previousState = { status: user.status, suspension: user.suspension };
  user.status = UserStatus.suspended;
  user.suspension = {
    type: payload.type,
    reason: payload.reason,
    context: payload.context,
    suspendedAt: new Date(),
    suspendedBy: objectId(adminId),
    expiresAt: payload.type === CustomerSuspensionType.temporary ? payload.expiresAt : undefined,
  } as any;
  await user.save();
  await AdminAction.create({ adminId, targetUserId: user._id, action: AdminCustomerAction.customerSuspended, reason: payload.reason, context: payload.context, previousState, newState: { status: user.status, suspension: user.suspension } });
  return serializeCustomer(user);
};

export const reactivateCustomer = async (id: string, reason: string, adminId: string) => {
  const user = await requireCustomer(id);
  if (user.status !== UserStatus.suspended) throw new BadRequestError("Customer is not suspended");
  const previousState = { status: user.status, suspension: user.suspension };
  user.status = UserStatus.active;
  user.suspension = { ...(user.suspension as any), reactivatedAt: new Date(), reactivatedBy: objectId(adminId) } as any;
  await user.save();
  await AdminAction.create({ adminId, targetUserId: user._id, action: AdminCustomerAction.customerReactivated, reason, previousState, newState: { status: user.status, suspension: user.suspension } });
  return serializeCustomer(user);
};

export const adjustCustomerWallet = async (id: string, payload: any, adminId: string) => {
  await requireCustomer(id);
  const userId = objectId(id);
  const reference = `admin-adjust:${payload.idempotencyKey}`;
  let transaction: any = await Transaction.findOne({ reference });
  if (transaction && String(transaction.userId) !== id) throw new BadRequestError("Idempotency key is already in use");
  if (transaction?.status === TransactionEnum.completed) {
    const wallet = await Wallet.findById(transaction.walletId);
    return { wallet, transaction, idempotentReplay: true };
  }

  const wallet = await Wallet.findOne({ userId, currency: payload.currency || WalletEnum.NGN }).select("+appliedAdjustments");
  if (!wallet) throw new NotFoundError("Customer wallet not found");
  const isCredit = payload.direction === "credit";
  const balanceBefore = wallet.balance;
  if (!transaction) {
    try {
      transaction = await Transaction.create({
        userId, walletId: wallet._id, type: isCredit ? TransactionType.CREDIT : TransactionType.DEBIT,
        amount: payload.amount, description: payload.reason, balanceBefore,
        status: TransactionEnum.pending, reference, paymentMethod: PaymentMethodEnum.wallet,
        currency: wallet.currency, serviceType: ServiceEnum.adminAdjustment,
        counterparty: "Emilist Admin",
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      transaction = await Transaction.findOne({ reference });
      if (!transaction || String(transaction.userId) !== id) {
        throw new BadRequestError("Idempotency key is already in use");
      }
    }
  }

  const walletQuery: any = { _id: wallet._id, appliedAdjustments: { $ne: reference } };
  if (!isCredit) walletQuery.balance = { $gte: payload.amount };
  let updatedWallet: any = await Wallet.findOneAndUpdate(walletQuery, {
    $inc: { balance: isCredit ? payload.amount : -payload.amount },
    $push: { appliedAdjustments: reference },
  }, { new: true }).select("+appliedAdjustments");

  if (!updatedWallet) {
    updatedWallet = await Wallet.findById(wallet._id).select("+appliedAdjustments");
    if (!(updatedWallet as any)?.appliedAdjustments?.includes(reference)) {
      transaction.status = TransactionEnum.failed;
      await transaction.save();
      throw new BadRequestError("Insufficient wallet balance");
    }
  }

  transaction.status = TransactionEnum.completed;
  transaction.balanceAfter = updatedWallet.balance;
  transaction.dateCompleted = new Date();
  await transaction.save();
  const action = isCredit ? AdminCustomerAction.walletCredited : AdminCustomerAction.walletDebited;
  if (!await AdminAction.exists({ action, "metadata.reference": reference })) {
    await AdminAction.create({ adminId, targetUserId: userId, action, reason: payload.reason, previousState: { balance: transaction.balanceBefore }, newState: { balance: updatedWallet.balance }, metadata: { reference, transactionId: transaction._id, currency: wallet.currency, amount: payload.amount } });
  }
  return { wallet: updatedWallet, transaction, idempotentReplay: false };
};

export const fetchCustomerAuditHistory = async (id: string, filters: any) => {
  await requireCustomer(id);
  const { page, limit, skip } = customerPagination(filters.page, filters.limit);
  const query = { targetUserId: objectId(id) };
  const [actions, total] = await Promise.all([
    AdminAction.find(query).populate("adminId", "fullName email role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminAction.countDocuments(query),
  ]);
  return { actions, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const logCustomerMessage = async (id: string, subject: string, adminId: string) => {
  const user = await requireCustomer(id);
  await AdminAction.create({
    adminId,
    targetUserId: user._id,
    action: AdminCustomerAction.messageSent,
    metadata: { subject },
  });
  return user;
};

export const consumeCustomerPasswordReset = async (token: string) => {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await Users.findOne({ adminPasswordResetTokenHash: tokenHash })
    .select("+adminPasswordResetTokenHash +adminPasswordResetExpiresAt");
  if (!user || !user.adminPasswordResetExpiresAt || user.adminPasswordResetExpiresAt.getTime() <= Date.now()) {
    throw new BadRequestError("This password reset link is invalid or has expired");
  }
  return user;
};
