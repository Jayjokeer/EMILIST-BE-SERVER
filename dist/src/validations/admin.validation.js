"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJobPaymentAdmin = exports.validateAddUserAdmin = exports.validateAdminWithdrawalDecision = exports.validateAdminOrderReturn = exports.validateAdminMaterialDelist = exports.validateAdminJobAction = exports.validateUpdateSupportRequest = exports.validateCreateSupportRequest = exports.validateAdminCustomerMessage = exports.validateCustomerWalletAdjustment = exports.validateCustomerReactivation = exports.validateCustomerSuspension = exports.validateUpdateCustomerProfile = exports.validateCreateCustomer = exports.validateAdminPasswordResetComplete = exports.validateAdminPasswordResetMfa = exports.validateAdminPasswordResetRequest = exports.validateAdminMfaEnrollment = exports.validateAdminMfaLogin = exports.validateAdminLogin = exports.validateAdminInvitationToken = exports.validateAdminAuthenticator = exports.validateAdminPasswordSetup = exports.validateCreateAdminInvitation = void 0;
const joi_1 = __importDefault(require("joi"));
const jobs_enum_1 = require("../enums/jobs.enum");
const user_enums_1 = require("../enums/user.enums");
const admin_customer_enum_1 = require("../enums/admin-customer.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const support_enum_1 = require("../enums/support.enum");
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        res.status(400).json({ errors: error.details.map((detail) => detail.message) });
        return;
    }
    req.body = value;
    next();
};
exports.validateCreateAdminInvitation = validate(joi_1.default.object({
    fullName: joi_1.default.string().trim().min(2).required(),
    email: joi_1.default.string().trim().lowercase().email().required(),
    mobile: joi_1.default.string().trim().allow("", null),
    department: joi_1.default.string().trim().max(80).default("Operations"),
    role: joi_1.default.string().valid(...Object.values(user_enums_1.AdminRolesEnum)).default(user_enums_1.AdminRolesEnum.admin),
}));
exports.validateAdminPasswordSetup = validate(joi_1.default.object({
    token: joi_1.default.string().required(),
    password: joi_1.default.string().min(12).required(),
    confirmPassword: joi_1.default.string().required(),
}));
exports.validateAdminAuthenticator = validate(joi_1.default.object({
    token: joi_1.default.string().required(),
    code: joi_1.default.string().pattern(/^\d{6}$/).required(),
}));
exports.validateAdminInvitationToken = validate(joi_1.default.object({
    token: joi_1.default.string().required(),
}));
exports.validateAdminLogin = validate(joi_1.default.object({
    email: joi_1.default.string().trim().lowercase().email().required(),
    password: joi_1.default.string().required(),
}));
exports.validateAdminMfaLogin = validate(joi_1.default.object({
    challengeToken: joi_1.default.string().required(),
    code: joi_1.default.string().pattern(/^\d{6}$/).required(),
}));
exports.validateAdminMfaEnrollment = validate(joi_1.default.object({
    enrollmentToken: joi_1.default.string().required(),
    code: joi_1.default.string().pattern(/^\d{6}$/).required(),
}));
exports.validateAdminPasswordResetRequest = validate(joi_1.default.object({
    email: joi_1.default.string().trim().lowercase().email().required(),
}));
exports.validateAdminPasswordResetMfa = validate(joi_1.default.object({
    token: joi_1.default.string().required(),
    code: joi_1.default.string().pattern(/^\d{6}$/).required(),
}));
exports.validateAdminPasswordResetComplete = validate(joi_1.default.object({
    authorizationToken: joi_1.default.string().required(),
    password: joi_1.default.string().min(12).required(),
    confirmPassword: joi_1.default.string().required(),
}));
exports.validateCreateCustomer = validate(joi_1.default.object({
    userName: joi_1.default.string().trim().min(3).max(40).required(),
    email: joi_1.default.string().trim().lowercase().email().required(),
    firstName: joi_1.default.string().trim().max(80).required(),
    middleName: joi_1.default.string().trim().max(80).allow("", null),
    lastName: joi_1.default.string().trim().max(80).required(),
    countryCode: joi_1.default.string().trim().max(8).required(),
    mobile: joi_1.default.string().trim().min(7).max(20).required(),
    businessMobile: joi_1.default.string().trim().min(7).max(20),
    whatsAppNumber: joi_1.default.string().trim().min(7).max(20),
    languages: joi_1.default.array().items(joi_1.default.string().trim().max(40)).single().default([]),
    houseAddress: joi_1.default.string().trim().max(250).required(),
    city: joi_1.default.string().trim().max(80).required(),
    state: joi_1.default.string().trim().max(80).required(),
    country: joi_1.default.string().trim().max(80).required(),
    bio: joi_1.default.string().trim().max(1000).allow("", null),
    displayImage: joi_1.default.string().uri().allow("", null),
}));
exports.validateUpdateCustomerProfile = validate(joi_1.default.object({
    countryCode: joi_1.default.string().trim().max(8),
    mobile: joi_1.default.string().trim().min(7).max(20),
    businessMobile: joi_1.default.string().trim().min(7).max(20),
    whatsAppNumber: joi_1.default.string().trim().min(7).max(20),
    languages: joi_1.default.array().items(joi_1.default.string().trim().max(40)).single(),
    houseAddress: joi_1.default.string().trim().max(250),
    city: joi_1.default.string().trim().max(80),
    state: joi_1.default.string().trim().max(80),
    country: joi_1.default.string().trim().max(80),
}).min(1));
exports.validateCustomerSuspension = validate(joi_1.default.object({
    type: joi_1.default.string().valid(...Object.values(admin_customer_enum_1.CustomerSuspensionType)).required(),
    reason: joi_1.default.string().valid(...Object.values(admin_customer_enum_1.CustomerSuspensionReason)).required(),
    context: joi_1.default.string().trim().max(1000).allow("", null),
    expiresAt: joi_1.default.date().greater("now").when("type", {
        is: admin_customer_enum_1.CustomerSuspensionType.permanent,
        then: joi_1.default.forbidden(),
        otherwise: joi_1.default.optional(),
    }),
}));
exports.validateCustomerReactivation = validate(joi_1.default.object({
    reason: joi_1.default.string().trim().min(3).max(500).required(),
}));
exports.validateCustomerWalletAdjustment = validate(joi_1.default.object({
    direction: joi_1.default.string().valid("credit", "debit").required(),
    amount: joi_1.default.number().positive().precision(2).required(),
    currency: joi_1.default.string().valid(...Object.values(transaction_enum_1.WalletEnum)).default(transaction_enum_1.WalletEnum.NGN),
    reason: joi_1.default.string().trim().min(3).max(500).required(),
    idempotencyKey: joi_1.default.string().trim().min(8).max(100).required(),
}));
exports.validateAdminCustomerMessage = validate(joi_1.default.object({
    subject: joi_1.default.string().trim().min(3).max(150).required(),
    message: joi_1.default.string().trim().min(1).max(5000).required(),
}));
exports.validateCreateSupportRequest = validate(joi_1.default.object({
    subject: joi_1.default.string().trim().min(3).max(150).required(),
    description: joi_1.default.string().trim().min(3).max(5000).required(),
    category: joi_1.default.string().valid(...Object.values(support_enum_1.SupportRequestCategory)).default(support_enum_1.SupportRequestCategory.other),
    priority: joi_1.default.string().valid(...Object.values(support_enum_1.SupportRequestPriority)).default(support_enum_1.SupportRequestPriority.normal),
    linkedType: joi_1.default.string().valid("job", "customer", "listing", "payment", "order"),
    linkedRecordId: joi_1.default.string().hex().length(24).when("linkedType", { is: joi_1.default.exist(), then: joi_1.default.required() }),
}));
exports.validateUpdateSupportRequest = validate(joi_1.default.object({
    status: joi_1.default.string().valid(...Object.values(support_enum_1.SupportRequestStatus)),
    priority: joi_1.default.string().valid(...Object.values(support_enum_1.SupportRequestPriority)),
    assignedAdminId: joi_1.default.string().hex().length(24).allow(null, ""),
    resolution: joi_1.default.string().trim().max(5000).allow("", null),
    note: joi_1.default.string().trim().max(2000).allow("", null),
}).min(1));
exports.validateAdminJobAction = validate(joi_1.default.object({
    action: joi_1.default.string().valid(...Object.values(jobs_enum_1.AdminJobActionEnum)).required(),
    reason: joi_1.default.string().trim().min(3).max(1000).when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring,
        then: joi_1.default.optional(),
        otherwise: joi_1.default.required(),
    }),
    frequency: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobFrequencyEnum)).when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring, then: joi_1.default.required(), otherwise: joi_1.default.forbidden(),
    }),
    startDate: joi_1.default.date().when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring, then: joi_1.default.required(), otherwise: joi_1.default.forbidden(),
    }),
    endDate: joi_1.default.date().greater(joi_1.default.ref("startDate")).when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring, then: joi_1.default.required(), otherwise: joi_1.default.forbidden(),
    }),
    currency: joi_1.default.string().valid(...Object.values(transaction_enum_1.WalletEnum)).when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring, then: joi_1.default.required(), otherwise: joi_1.default.forbidden(),
    }),
    amount: joi_1.default.number().positive().precision(2).when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring, then: joi_1.default.required(), otherwise: joi_1.default.forbidden(),
    }),
    budgetPeriod: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobFrequencyEnum)).when("action", {
        is: jobs_enum_1.AdminJobActionEnum.convertToRecurring, then: joi_1.default.required(), otherwise: joi_1.default.forbidden(),
    }),
}));
exports.validateAdminMaterialDelist = validate(joi_1.default.object({
    reason: joi_1.default.string().trim().min(3).max(1000).required(),
}));
exports.validateAdminOrderReturn = validate(joi_1.default.object({
    reason: joi_1.default.string().trim().min(3).max(1000).required(),
}));
exports.validateAdminWithdrawalDecision = validate(joi_1.default.object({
    reason: joi_1.default.string().trim().min(3).max(1000).required(),
}));
const validateAddUserAdmin = (req, res, next) => {
    const adminaddUserValidation = joi_1.default.object({
        userName: joi_1.default.string().required().messages({
            "string.base": "username must be a string",
            "string.empty": "username is required",
        }),
        email: joi_1.default.string().required().messages({
            "string.base": "Email must be a string",
            "string.empty": "Email is required",
        }),
    });
    const { error } = adminaddUserValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateAddUserAdmin = validateAddUserAdmin;
const validateJobPaymentAdmin = (req, res, next) => {
    const updateJobPaymentValidation = joi_1.default.object({
        status: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.MilestonePaymentStatus))
            .required()
            .messages({
            'any.only': 'Invalid status , must be one of: ' + Object.values(jobs_enum_1.MilestonePaymentStatus).join(', '),
            'any.required': 'Status is required',
        }),
        milestoneId: joi_1.default.string().required().messages({
            "string.base": "Milestone Id must be a string",
            "string.empty": "Milestone Id is required",
        }),
    });
    const { error } = updateJobPaymentValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateJobPaymentAdmin = validateJobPaymentAdmin;
