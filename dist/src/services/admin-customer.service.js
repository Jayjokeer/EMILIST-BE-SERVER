"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeCustomerPasswordReset = exports.logCustomerMessage = exports.fetchCustomerAuditHistory = exports.adjustCustomerWallet = exports.reactivateCustomer = exports.suspendCustomer = exports.createCustomerPasswordReset = exports.updateCustomerProfile = exports.createCustomer = exports.fetchCustomerSubscriptions = exports.fetchCustomerTransactions = exports.fetchCustomerSales = exports.fetchCustomerOrders = exports.fetchCustomerListings = exports.fetchCustomerJobs = exports.fetchCustomerServices = exports.fetchCustomerDetails = exports.fetchCustomerOverview = exports.fetchCustomers = exports.fetchCustomerSummary = exports.requireCustomer = exports.walletBalanceChangePercentage = exports.customerTransactionDirection = exports.customerPagination = void 0;
const crypto_1 = require("crypto");
const mongoose_1 = require("mongoose");
const users_model_1 = __importDefault(require("../models/users.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const business_model_1 = __importDefault(require("../models/business.model"));
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const plan_model_1 = __importDefault(require("../models/plan.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const admin_action_model_1 = __importDefault(require("../models/admin-action.model"));
const error_1 = require("../errors/error");
const admin_customer_enum_1 = require("../enums/admin-customer.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const user_enums_1 = require("../enums/user.enums");
const utility_1 = require("../utils/utility");
const plan_enum_1 = require("../enums/plan.enum");
const customerPagination = (pageValue, limitValue) => {
    const page = Math.max(1, Number(pageValue) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
exports.customerPagination = customerPagination;
const customerTransactionDirection = (transaction, customerId) => String(transaction.recieverId || "") === customerId && String(transaction.userId || "") !== customerId
    ? "inflow"
    : transaction.type === transaction_enum_1.TransactionType.CREDIT ? "inflow" : "outflow";
exports.customerTransactionDirection = customerTransactionDirection;
const walletBalanceChangePercentage = (currentBalance, previousBalance) => previousBalance && Number.isFinite(previousBalance)
    ? Number((((currentBalance - previousBalance) / previousBalance) * 100).toFixed(2))
    : 0;
exports.walletBalanceChangePercentage = walletBalanceChangePercentage;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const objectId = (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        throw new error_1.NotFoundError("Customer not found");
    return new mongoose_1.Types.ObjectId(id);
};
const requireCustomer = async (id) => {
    const user = await users_model_1.default.findById(objectId(id)).select("-password -registrationOtp -passwordResetOtp -otpExpiresAt -accessToken -googleId");
    if (!user)
        throw new error_1.NotFoundError("Customer not found");
    return user;
};
exports.requireCustomer = requireCustomer;
const customerName = (user) => [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || null;
const serializeCustomer = (user) => ({
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
const fetchCustomerSummary = async () => {
    const [activeCustomers, pendingKyc, inactiveCustomers, expertIds, merchantIds, totalCustomers] = await Promise.all([
        users_model_1.default.countDocuments({ status: user_enums_1.UserStatus.active }),
        users_model_1.default.countDocuments({ isVerified: false, requestedVerification: true }),
        users_model_1.default.countDocuments({ status: user_enums_1.UserStatus.deactivated }),
        business_model_1.default.distinct("userId"),
        product_model_1.default.distinct("userId", { isDeleted: false }),
        users_model_1.default.countDocuments(),
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
exports.fetchCustomerSummary = fetchCustomerSummary;
const fetchCustomers = async (filters) => {
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const query = {};
    const normalizedStatus = String(filters.status || "").toLowerCase();
    if (normalizedStatus === "active")
        query.status = user_enums_1.UserStatus.active;
    if (normalizedStatus === "inactive")
        query.status = user_enums_1.UserStatus.deactivated;
    if (normalizedStatus === "suspended")
        query.status = user_enums_1.UserStatus.suspended;
    if (String(filters.kyc || "").toLowerCase() === "pending") {
        query.isVerified = false;
        query.requestedVerification = true;
    }
    if (filters.profileComplete !== undefined)
        query.isProfileComplete = String(filters.profileComplete) === "true";
    if (filters.type === "expert")
        query._id = { $in: await business_model_1.default.distinct("userId") };
    if (filters.type === "merchant")
        query._id = { $in: await product_model_1.default.distinct("userId", { isDeleted: false }) };
    if (String(filters.search || "").trim()) {
        const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
        query.$or = [
            { firstName: regex }, { lastName: regex }, { userName: regex },
            { email: regex }, { uniqueId: regex }, { mobile: regex }, { houseAddress: regex },
        ];
    }
    const [users, total] = await Promise.all([
        users_model_1.default.find(query).select("-password -registrationOtp -passwordResetOtp -otpExpiresAt -accessToken -googleId")
            .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        users_model_1.default.countDocuments(query),
    ]);
    return { customers: users.map(serializeCustomer), total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.fetchCustomers = fetchCustomers;
const fetchCustomerOverview = async (id) => {
    const user = await (0, exports.requireCustomer)(id);
    const userId = objectId(id);
    const [wallets, businesses] = await Promise.all([
        wallet_model_1.default.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean(),
        business_model_1.default.find({ userId }).select("services reviews").lean(),
    ]);
    const wallet = wallets.find((entry) => entry.isDefault) || wallets[0] || null;
    const earliestPeriodTransaction = wallet ? await transaction_model_1.default.findOne({
        $or: [{ userId }, { recieverId: userId }],
        walletId: wallet._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        balanceBefore: { $exists: true },
    }).sort({ createdAt: 1 }).select("balanceBefore").lean() : null;
    const businessIds = businesses.map((business) => business._id);
    const rating = businessIds.length ? await review_model_1.default.aggregate([
        { $match: { businessId: { $in: businessIds } } },
        { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]) : [];
    const balanceBefore = Number(earliestPeriodTransaction?.balanceBefore);
    const balanceChangePercentage = wallet ? (0, exports.walletBalanceChangePercentage)(wallet.balance, balanceBefore) : 0;
    const tags = [...new Set(businesses.flatMap((business) => business.services || []))];
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
exports.fetchCustomerOverview = fetchCustomerOverview;
const fetchCustomerDetails = async (id) => {
    const user = await (0, exports.requireCustomer)(id);
    const business = await business_model_1.default.findOne({ userId: objectId(id) }).select("phoneNumber").lean();
    return {
        ...serializeCustomer(user),
        businessMobile: user.businessMobile || business?.phoneNumber || null,
    };
};
exports.fetchCustomerDetails = fetchCustomerDetails;
const fetchCustomerServices = async (id) => {
    await (0, exports.requireCustomer)(id);
    const businesses = await business_model_1.default.find({ userId: objectId(id) }).populate("reviews", "rating").lean();
    return Promise.all(businesses.map(async (business) => {
        const ratings = (business.reviews || []).map((review) => Number(review.rating)).filter(Number.isFinite);
        const [jobsCompleted, totalProjects, earnings] = await Promise.all([
            project_model_1.default.countDocuments({ businessId: business._id, status: "completed" }),
            project_model_1.default.countDocuments({ businessId: business._id }),
            transaction_model_1.default.aggregate([
                { $match: { recieverId: objectId(id), status: transaction_enum_1.TransactionEnum.completed } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);
        return {
            ...business,
            metrics: {
                jobsCompleted,
                totalEarnings: earnings[0]?.total || 0,
                rating: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : 0,
                jobCompletionRate: totalProjects ? Number(((jobsCompleted / totalProjects) * 100).toFixed(2)) : 0,
            },
        };
    }));
};
exports.fetchCustomerServices = fetchCustomerServices;
const fetchCustomerJobs = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const userId = objectId(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const applications = await project_model_1.default.find({ user: userId }).select("job status").lean();
    const applicationStatus = new Map(applications.map((item) => [String(item.job), item.status]));
    const query = { $or: [{ userId }, { _id: { $in: applications.map((item) => item.job) } }] };
    if (filters.status)
        query.status = filters.status;
    if (String(filters.search || "").trim()) {
        const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
        query.$and = [{ $or: [{ title: regex }, { category: regex }, { jobCategory: regex }] }];
    }
    const [jobs, total] = await Promise.all([
        jobs_model_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        jobs_model_1.default.countDocuments(query),
    ]);
    return {
        jobs: jobs.map((job) => ({
            ...job,
            role: String(job.userId) === id ? "owner" : "applicant",
            applicationStatus: applicationStatus.get(String(job._id)) || null,
        })), total, page, limit, totalPages: Math.ceil(total / limit),
    };
};
exports.fetchCustomerJobs = fetchCustomerJobs;
const fetchCustomerListings = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const query = { userId: objectId(id), isDeleted: false };
    if (filters.status)
        query.status = filters.status;
    if (String(filters.search || "").trim()) {
        const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
        query.$or = [{ name: regex }, { brand: regex }, { storeName: regex }, { subCategory: regex }];
    }
    const [listings, total] = await Promise.all([
        product_model_1.default.find(query).populate("category", "name slug").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        product_model_1.default.countDocuments(query),
    ]);
    return {
        listings: listings.map((listing) => ({
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
exports.fetchCustomerListings = fetchCustomerListings;
const fetchCustomerOrders = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const query = { userId: objectId(id) };
    if (filters.status)
        query.deliveryStatus = filters.status;
    const [orders, total] = await Promise.all([
        order_model_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        order_model_1.default.countDocuments(query),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.fetchCustomerOrders = fetchCustomerOrders;
const fetchCustomerSales = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const userId = objectId(id);
    const match = { "products.merchantId": userId };
    if (filters.status)
        match.deliveryStatus = filters.status;
    const pipeline = [
        { $match: match }, { $unwind: "$products" }, { $match: { "products.merchantId": userId } },
        { $sort: { createdAt: -1 } },
    ];
    if (String(filters.search || "").trim()) {
        const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
        pipeline.push({ $match: { $or: [{ "products.productName": regex }, { "products.merchantName": regex }, { shippingAddress: regex }] } });
    }
    pipeline.push({ $facet: { rows: [{ $skip: skip }, { $limit: limit }], count: [{ $count: "total" }] } });
    const [result] = await order_model_1.default.aggregate(pipeline);
    const total = result?.count?.[0]?.total || 0;
    return { sales: result?.rows || [], total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.fetchCustomerSales = fetchCustomerSales;
const fetchCustomerTransactions = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const userId = objectId(id);
    const conditions = [{ $or: [{ userId }, { recieverId: userId }] }];
    if (filters.status)
        conditions.push({ status: filters.status });
    if (filters.type === "inflow")
        conditions.push({
            $or: [{ userId, type: transaction_enum_1.TransactionType.CREDIT }, { recieverId: userId }],
        });
    if (filters.type === "outflow")
        conditions.push({ userId, type: transaction_enum_1.TransactionType.DEBIT });
    if (String(filters.search || "").trim()) {
        const regex = new RegExp(escapeRegex(String(filters.search).trim()), "i");
        conditions.push({ $or: [{ reference: regex }, { counterparty: regex }, { description: regex }] });
    }
    const query = { $and: conditions };
    const [transactions, total] = await Promise.all([
        transaction_model_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        transaction_model_1.default.countDocuments(query),
    ]);
    return {
        transactions: transactions.map((transaction) => ({
            ...transaction,
            direction: (0, exports.customerTransactionDirection)(transaction, id),
        })),
        total, page, limit, totalPages: Math.ceil(total / limit),
    };
};
exports.fetchCustomerTransactions = fetchCustomerTransactions;
const fetchCustomerSubscriptions = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const userId = objectId(id);
    const [subscriptions, total, plans, receipts] = await Promise.all([
        subscription_model_1.default.find({ userId }).populate("planId", "name price duration isActive").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        subscription_model_1.default.countDocuments({ userId }),
        plan_model_1.default.find().sort({ price: 1 }).lean(),
        transaction_model_1.default.find({ userId, serviceType: transaction_enum_1.ServiceEnum.subscription }).select("planId amount status transferReceipt createdAt dateCompleted reference").sort({ createdAt: -1 }).lean(),
    ]);
    return { subscriptions, plans, receipts, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.fetchCustomerSubscriptions = fetchCustomerSubscriptions;
const createCustomer = async (payload, adminId) => {
    const email = payload.email.toLowerCase().trim();
    if (await users_model_1.default.exists({ email }))
        throw new error_1.BadRequestError("A customer with this email already exists");
    if (await users_model_1.default.exists({ userName: payload.userName }))
        throw new error_1.BadRequestError("This username is already in use");
    const user = await users_model_1.default.create({
        ...payload,
        email,
        uniqueId: (0, utility_1.generateShortUUID)(),
        languages: payload.languages || [],
        isProfileComplete: Boolean(payload.firstName && payload.lastName && payload.mobile && payload.houseAddress),
    });
    const wallet = await wallet_model_1.default.create({ userId: user._id, currency: transaction_enum_1.WalletEnum.NGN, isDefault: true });
    user.wallets.push(wallet._id);
    const plan = await plan_model_1.default.findOne({ name: plan_enum_1.PlanEnum.basic });
    if (plan) {
        const subscription = await subscription_model_1.default.create({ userId: user._id, planId: plan._id, startDate: new Date(), perks: plan.perks });
        user.subscription = subscription._id;
    }
    await user.save();
    await admin_action_model_1.default.create({ adminId, targetUserId: user._id, action: admin_customer_enum_1.AdminCustomerAction.customerCreated, newState: serializeCustomer(user) });
    return user;
};
exports.createCustomer = createCustomer;
const updateCustomerProfile = async (id, payload, adminId) => {
    const user = await (0, exports.requireCustomer)(id);
    const previousState = serializeCustomer(user);
    Object.assign(user, payload);
    await user.save();
    await admin_action_model_1.default.create({ adminId, targetUserId: user._id, action: admin_customer_enum_1.AdminCustomerAction.profileUpdated, previousState, newState: serializeCustomer(user) });
    return serializeCustomer(user);
};
exports.updateCustomerProfile = updateCustomerProfile;
const createCustomerPasswordReset = async (id, adminId) => {
    const user = await (0, exports.requireCustomer)(id);
    const token = (0, crypto_1.randomBytes)(32).toString("base64url");
    user.adminPasswordResetTokenHash = (0, crypto_1.createHash)("sha256").update(token).digest("hex");
    user.adminPasswordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    await admin_action_model_1.default.create({ adminId, targetUserId: user._id, action: admin_customer_enum_1.AdminCustomerAction.passwordResetTriggered, metadata: { expiresAt: user.adminPasswordResetExpiresAt } });
    return { user, token, expiresAt: user.adminPasswordResetExpiresAt };
};
exports.createCustomerPasswordReset = createCustomerPasswordReset;
const suspendCustomer = async (id, payload, adminId) => {
    const user = await (0, exports.requireCustomer)(id);
    const previousState = { status: user.status, suspension: user.suspension };
    user.status = user_enums_1.UserStatus.suspended;
    user.suspension = {
        type: payload.type,
        reason: payload.reason,
        context: payload.context,
        suspendedAt: new Date(),
        suspendedBy: objectId(adminId),
        expiresAt: payload.type === admin_customer_enum_1.CustomerSuspensionType.temporary ? payload.expiresAt : undefined,
    };
    await user.save();
    await admin_action_model_1.default.create({ adminId, targetUserId: user._id, action: admin_customer_enum_1.AdminCustomerAction.customerSuspended, reason: payload.reason, context: payload.context, previousState, newState: { status: user.status, suspension: user.suspension } });
    return serializeCustomer(user);
};
exports.suspendCustomer = suspendCustomer;
const reactivateCustomer = async (id, reason, adminId) => {
    const user = await (0, exports.requireCustomer)(id);
    if (user.status !== user_enums_1.UserStatus.suspended)
        throw new error_1.BadRequestError("Customer is not suspended");
    const previousState = { status: user.status, suspension: user.suspension };
    user.status = user_enums_1.UserStatus.active;
    user.suspension = { ...user.suspension, reactivatedAt: new Date(), reactivatedBy: objectId(adminId) };
    await user.save();
    await admin_action_model_1.default.create({ adminId, targetUserId: user._id, action: admin_customer_enum_1.AdminCustomerAction.customerReactivated, reason, previousState, newState: { status: user.status, suspension: user.suspension } });
    return serializeCustomer(user);
};
exports.reactivateCustomer = reactivateCustomer;
const adjustCustomerWallet = async (id, payload, adminId) => {
    await (0, exports.requireCustomer)(id);
    const userId = objectId(id);
    const reference = `admin-adjust:${payload.idempotencyKey}`;
    let transaction = await transaction_model_1.default.findOne({ reference });
    if (transaction && String(transaction.userId) !== id)
        throw new error_1.BadRequestError("Idempotency key is already in use");
    if (transaction?.status === transaction_enum_1.TransactionEnum.completed) {
        const wallet = await wallet_model_1.default.findById(transaction.walletId);
        return { wallet, transaction, idempotentReplay: true };
    }
    const wallet = await wallet_model_1.default.findOne({ userId, currency: payload.currency || transaction_enum_1.WalletEnum.NGN }).select("+appliedAdjustments");
    if (!wallet)
        throw new error_1.NotFoundError("Customer wallet not found");
    const isCredit = payload.direction === "credit";
    const balanceBefore = wallet.balance;
    if (!transaction) {
        try {
            transaction = await transaction_model_1.default.create({
                userId, walletId: wallet._id, type: isCredit ? transaction_enum_1.TransactionType.CREDIT : transaction_enum_1.TransactionType.DEBIT,
                amount: payload.amount, description: payload.reason, balanceBefore,
                status: transaction_enum_1.TransactionEnum.pending, reference, paymentMethod: transaction_enum_1.PaymentMethodEnum.wallet,
                currency: wallet.currency, serviceType: transaction_enum_1.ServiceEnum.adminAdjustment,
                counterparty: "Emilist Admin",
            });
        }
        catch (error) {
            if (error?.code !== 11000)
                throw error;
            transaction = await transaction_model_1.default.findOne({ reference });
            if (!transaction || String(transaction.userId) !== id) {
                throw new error_1.BadRequestError("Idempotency key is already in use");
            }
        }
    }
    const walletQuery = { _id: wallet._id, appliedAdjustments: { $ne: reference } };
    if (!isCredit)
        walletQuery.balance = { $gte: payload.amount };
    let updatedWallet = await wallet_model_1.default.findOneAndUpdate(walletQuery, {
        $inc: { balance: isCredit ? payload.amount : -payload.amount },
        $push: { appliedAdjustments: reference },
    }, { new: true }).select("+appliedAdjustments");
    if (!updatedWallet) {
        updatedWallet = await wallet_model_1.default.findById(wallet._id).select("+appliedAdjustments");
        if (!updatedWallet?.appliedAdjustments?.includes(reference)) {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            await transaction.save();
            throw new error_1.BadRequestError("Insufficient wallet balance");
        }
    }
    transaction.status = transaction_enum_1.TransactionEnum.completed;
    transaction.balanceAfter = updatedWallet.balance;
    transaction.dateCompleted = new Date();
    await transaction.save();
    const action = isCredit ? admin_customer_enum_1.AdminCustomerAction.walletCredited : admin_customer_enum_1.AdminCustomerAction.walletDebited;
    if (!await admin_action_model_1.default.exists({ action, "metadata.reference": reference })) {
        await admin_action_model_1.default.create({ adminId, targetUserId: userId, action, reason: payload.reason, previousState: { balance: transaction.balanceBefore }, newState: { balance: updatedWallet.balance }, metadata: { reference, transactionId: transaction._id, currency: wallet.currency, amount: payload.amount } });
    }
    return { wallet: updatedWallet, transaction, idempotentReplay: false };
};
exports.adjustCustomerWallet = adjustCustomerWallet;
const fetchCustomerAuditHistory = async (id, filters) => {
    await (0, exports.requireCustomer)(id);
    const { page, limit, skip } = (0, exports.customerPagination)(filters.page, filters.limit);
    const query = { targetUserId: objectId(id) };
    const [actions, total] = await Promise.all([
        admin_action_model_1.default.find(query).populate("adminId", "fullName email role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        admin_action_model_1.default.countDocuments(query),
    ]);
    return { actions, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.fetchCustomerAuditHistory = fetchCustomerAuditHistory;
const logCustomerMessage = async (id, subject, adminId) => {
    const user = await (0, exports.requireCustomer)(id);
    await admin_action_model_1.default.create({
        adminId,
        targetUserId: user._id,
        action: admin_customer_enum_1.AdminCustomerAction.messageSent,
        metadata: { subject },
    });
    return user;
};
exports.logCustomerMessage = logCustomerMessage;
const consumeCustomerPasswordReset = async (token) => {
    const tokenHash = (0, crypto_1.createHash)("sha256").update(token).digest("hex");
    const user = await users_model_1.default.findOne({ adminPasswordResetTokenHash: tokenHash })
        .select("+adminPasswordResetTokenHash +adminPasswordResetExpiresAt");
    if (!user || !user.adminPasswordResetExpiresAt || user.adminPasswordResetExpiresAt.getTime() <= Date.now()) {
        throw new error_1.BadRequestError("This password reset link is invalid or has expired");
    }
    return user;
};
exports.consumeCustomerPasswordReset = consumeCustomerPasswordReset;
