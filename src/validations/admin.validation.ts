import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { AdminJobActionEnum, JobFrequencyEnum, MilestonePaymentStatus } from "../enums/jobs.enum";
import { AdminRolesEnum } from "../enums/user.enums";
import { CustomerSuspensionReason, CustomerSuspensionType } from "../enums/admin-customer.enum";
import { WalletEnum } from "../enums/transaction.enum";
import { SupportRequestCategory, SupportRequestPriority, SupportRequestStatus } from "../enums/support.enum";

const validate = (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      res.status(400).json({ errors: error.details.map((detail) => detail.message) });
      return;
    }
    req.body = value;
    next();
  };

export const validateCreateAdminInvitation = validate(Joi.object({
  fullName: Joi.string().trim().min(2).required(),
  email: Joi.string().trim().lowercase().email().required(),
  mobile: Joi.string().trim().allow("", null),
  department: Joi.string().trim().max(80).default("Operations"),
  role: Joi.string().valid(...Object.values(AdminRolesEnum)).default(AdminRolesEnum.admin),
}));

export const validateAdminPasswordSetup = validate(Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(12).required(),
  confirmPassword: Joi.string().required(),
}));

export const validateAdminAuthenticator = validate(Joi.object({
  token: Joi.string().required(),
  code: Joi.string().pattern(/^\d{6}$/).required(),
}));

export const validateAdminInvitationToken = validate(Joi.object({
  token: Joi.string().required(),
}));

export const validateAdminLogin = validate(Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
}));

export const validateAdminMfaLogin = validate(Joi.object({
  challengeToken: Joi.string().required(),
  code: Joi.string().pattern(/^\d{6}$/).required(),
}));

export const validateAdminMfaEnrollment = validate(Joi.object({
  enrollmentToken: Joi.string().required(),
  code: Joi.string().pattern(/^\d{6}$/).required(),
}));

export const validateAdminPasswordResetRequest = validate(Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
}));

export const validateAdminPasswordResetMfa = validate(Joi.object({
  token: Joi.string().required(),
  code: Joi.string().pattern(/^\d{6}$/).required(),
}));

export const validateAdminPasswordResetComplete = validate(Joi.object({
  authorizationToken: Joi.string().required(),
  password: Joi.string().min(12).required(),
  confirmPassword: Joi.string().required(),
}));

export const validateCreateCustomer = validate(Joi.object({
  userName: Joi.string().trim().min(3).max(40).required(),
  email: Joi.string().trim().lowercase().email().required(),
  firstName: Joi.string().trim().max(80).required(),
  middleName: Joi.string().trim().max(80).allow("", null),
  lastName: Joi.string().trim().max(80).required(),
  countryCode: Joi.string().trim().max(8).required(),
  mobile: Joi.string().trim().min(7).max(20).required(),
  businessMobile: Joi.string().trim().min(7).max(20),
  whatsAppNumber: Joi.string().trim().min(7).max(20),
  languages: Joi.array().items(Joi.string().trim().max(40)).single().default([]),
  houseAddress: Joi.string().trim().max(250).required(),
  city: Joi.string().trim().max(80).required(),
  state: Joi.string().trim().max(80).required(),
  country: Joi.string().trim().max(80).required(),
  bio: Joi.string().trim().max(1000).allow("", null),
  displayImage: Joi.string().uri().allow("", null),
}));

export const validateUpdateCustomerProfile = validate(Joi.object({
  countryCode: Joi.string().trim().max(8),
  mobile: Joi.string().trim().min(7).max(20),
  businessMobile: Joi.string().trim().min(7).max(20),
  whatsAppNumber: Joi.string().trim().min(7).max(20),
  languages: Joi.array().items(Joi.string().trim().max(40)).single(),
  houseAddress: Joi.string().trim().max(250),
  city: Joi.string().trim().max(80),
  state: Joi.string().trim().max(80),
  country: Joi.string().trim().max(80),
}).min(1));

export const validateCustomerSuspension = validate(Joi.object({
  type: Joi.string().valid(...Object.values(CustomerSuspensionType)).required(),
  reason: Joi.string().valid(...Object.values(CustomerSuspensionReason)).required(),
  context: Joi.string().trim().max(1000).allow("", null),
  expiresAt: Joi.date().greater("now").when("type", {
    is: CustomerSuspensionType.permanent,
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
}));

export const validateCustomerReactivation = validate(Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
}));

export const validateCustomerWalletAdjustment = validate(Joi.object({
  direction: Joi.string().valid("credit", "debit").required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid(...Object.values(WalletEnum)).default(WalletEnum.NGN),
  reason: Joi.string().trim().min(3).max(500).required(),
  idempotencyKey: Joi.string().trim().min(8).max(100).required(),
}));

export const validateAdminCustomerMessage = validate(Joi.object({
  subject: Joi.string().trim().min(3).max(150).required(),
  message: Joi.string().trim().min(1).max(5000).required(),
}));

export const validateCreateSupportRequest = validate(Joi.object({
  subject: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().min(3).max(5000).required(),
  category: Joi.string().valid(...Object.values(SupportRequestCategory)).default(SupportRequestCategory.other),
  priority: Joi.string().valid(...Object.values(SupportRequestPriority)).default(SupportRequestPriority.normal),
  linkedType: Joi.string().valid("job", "customer", "listing", "payment", "order"),
  linkedRecordId: Joi.string().hex().length(24).when("linkedType", { is: Joi.exist(), then: Joi.required() }),
}));

export const validateUpdateSupportRequest = validate(Joi.object({
  status: Joi.string().valid(...Object.values(SupportRequestStatus)),
  priority: Joi.string().valid(...Object.values(SupportRequestPriority)),
  assignedAdminId: Joi.string().hex().length(24).allow(null, ""),
  resolution: Joi.string().trim().max(5000).allow("", null),
  note: Joi.string().trim().max(2000).allow("", null),
}).min(1));

export const validateAdminJobAction = validate(Joi.object({
  action: Joi.string().valid(...Object.values(AdminJobActionEnum)).required(),
  reason: Joi.string().trim().min(3).max(1000).when("action", {
    is: AdminJobActionEnum.convertToRecurring,
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  frequency: Joi.string().valid(...Object.values(JobFrequencyEnum)).when("action", {
    is: AdminJobActionEnum.convertToRecurring, then: Joi.required(), otherwise: Joi.forbidden(),
  }),
  startDate: Joi.date().when("action", {
    is: AdminJobActionEnum.convertToRecurring, then: Joi.required(), otherwise: Joi.forbidden(),
  }),
  endDate: Joi.date().greater(Joi.ref("startDate")).when("action", {
    is: AdminJobActionEnum.convertToRecurring, then: Joi.required(), otherwise: Joi.forbidden(),
  }),
  currency: Joi.string().valid(...Object.values(WalletEnum)).when("action", {
    is: AdminJobActionEnum.convertToRecurring, then: Joi.required(), otherwise: Joi.forbidden(),
  }),
  amount: Joi.number().positive().precision(2).when("action", {
    is: AdminJobActionEnum.convertToRecurring, then: Joi.required(), otherwise: Joi.forbidden(),
  }),
  budgetPeriod: Joi.string().valid(...Object.values(JobFrequencyEnum)).when("action", {
    is: AdminJobActionEnum.convertToRecurring, then: Joi.required(), otherwise: Joi.forbidden(),
  }),
}));

export const validateAdminMaterialDelist = validate(Joi.object({
  reason: Joi.string().trim().min(3).max(1000).required(),
}));

export const validateAdminOrderReturn = validate(Joi.object({
  reason: Joi.string().trim().min(3).max(1000).required(),
}));

export const validateAdminWithdrawalDecision = validate(Joi.object({
  reason: Joi.string().trim().min(3).max(1000).required(),
}));


export const validateAddUserAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminaddUserValidation = Joi.object({
      userName: Joi.string().required().messages({
        "string.base": "username must be a string",
        "string.empty": "username is required",
      }),
      email: Joi.string().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email is required",
      }),
    });
  
    const { error } = adminaddUserValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
    next();
  };
  export const validateJobPaymentAdmin = (req: Request, res: Response, next: NextFunction) => {
    const updateJobPaymentValidation = Joi.object({
      status: Joi.string()
      .valid(...Object.values(MilestonePaymentStatus)) 
      .required()
      .messages({
        'any.only': 'Invalid status , must be one of: ' + Object.values(MilestonePaymentStatus).join(', '),
        'any.required': 'Status is required',
      }),
      milestoneId: Joi.string().required().messages({
        "string.base": "Milestone Id must be a string",
        "string.empty": "Milestone Id is required",
      }),
    });
  
    const { error } = updateJobPaymentValidation .validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
    next();
  };
