"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateMilestonePayment = exports.validatePostQuote = exports.validateMilestoneStatusUpdate = exports.validateProjectApplication = exports.validateUpdateJob = exports.validateJob = void 0;
const joi_1 = __importDefault(require("joi"));
const jobs_enum_1 = require("../enums/jobs.enum");
const validateJob = (req, res, next) => {
    const jobValidation = joi_1.default.object({
        category: joi_1.default.string().required().messages({
            'string.empty': 'Category is required',
        }),
        service: joi_1.default.string().required().messages({
            'string.empty': 'Service is required',
        }),
        title: joi_1.default.string().required().messages({
            'string.empty': 'Title is required',
        }),
        description: joi_1.default.string().required().messages({
            'string.empty': 'Description is required',
        }),
        jobFiles: joi_1.default.array().items(joi_1.default.string()).messages({
            'string.base': 'Each job file must be a string (URL or file path)',
        }),
        duration: joi_1.default.object({
            number: joi_1.default.number().required().messages({
                'number.base': 'Duration number must be a number',
                'any.required': 'Duration number is required',
            }),
            period: joi_1.default.string()
                .valid(...Object.values(jobs_enum_1.JobPeriod))
                .required()
                .messages({
                'any.only': 'Invalid period, must be one of: ' + Object.values(jobs_enum_1.JobPeriod).join(', '),
                'any.required': 'Duration period is required',
            }),
        }).required(),
        type: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.JobType))
            .required()
            .messages({
            'any.only': 'Invalid job type, must be one of: ' + Object.values(jobs_enum_1.JobType).join(', '),
            'any.required': 'Job type is required',
        }),
        location: joi_1.default.string().required().messages({
            'string.empty': 'Location is required',
        }),
        expertLevel: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.JobExpertLevel))
            .required()
            .messages({
            'any.only': 'Invalid expert level, must be one of: ' + Object.values(jobs_enum_1.JobExpertLevel).join(', '),
            'any.required': 'Expert level is required',
        }),
        milestones: joi_1.default.array().items(joi_1.default.object({
            timeFrame: joi_1.default.object({
                number: joi_1.default.number().required(),
                period: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobPeriod)).required(),
            }).required(),
            achievement: joi_1.default.string().required(),
            amount: joi_1.default.number().required(),
        })).max(5).required(),
        maximumPrice: joi_1.default.when('type', {
            is: 'biddable',
            then: joi_1.default.number().required().messages({
                'number.base': 'Maximum price must be a number',
                'any.required': 'Maximum price is required for biddable jobs',
            }),
            otherwise: joi_1.default.forbidden(),
        }),
        bidRange: joi_1.default.when('type', {
            is: 'biddable',
            then: joi_1.default.number().required().messages({
                'number.base': 'Bid range must be a number',
                'any.required': 'Bid range is required for biddable jobs',
            }),
            otherwise: joi_1.default.forbidden(),
        }),
        budget: joi_1.default.when('type', {
            is: joi_1.default.string().valid('regular', 'direct'),
            then: joi_1.default.number().required().messages({
                'number.base': 'Budget must be a number',
                'any.required': 'Budget is required for regular or direct jobs',
            }),
            otherwise: joi_1.default.forbidden(),
        }),
        achievementDetails: joi_1.default.string().messages({
            'string.empty': 'Achievement details must be a string',
        }),
        currency: joi_1.default.string().messages({
            'string.empty': 'Currency must be a string',
        }),
        userName: joi_1.default.string().optional().messages({
            'string.empty': 'UserName must be a string',
        }),
        email: joi_1.default.string().optional().messages({
            'string.empty': 'Email must be a string',
        }),
        identifier: joi_1.default.string().optional().messages({
            'string.empty': 'Identifier must be a string',
        }),
    });
    const { error } = jobValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateJob = validateJob;
const validateUpdateJob = (req, res, next) => {
    const updateJobValidation = joi_1.default.object({
        category: joi_1.default.string().optional(),
        service: joi_1.default.string().optional(),
        title: joi_1.default.string().optional(),
        description: joi_1.default.string().optional(),
        jobFiles: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each job file must be a string (URL or file path)',
        }),
        duration: joi_1.default.object({
            number: joi_1.default.number().optional().messages({
                'number.base': 'Duration number must be a number',
            }),
            period: joi_1.default.string()
                .valid(...Object.values(jobs_enum_1.JobPeriod))
                .optional()
                .messages({
                'any.only': 'Invalid period, must be one of: ' + Object.values(jobs_enum_1.JobPeriod).join(', '),
            }),
        }).optional(),
        type: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.JobType))
            .optional()
            .messages({
            'any.only': 'Invalid job type, must be one of: ' + Object.values(jobs_enum_1.JobType).join(', '),
        }),
        location: joi_1.default.string().optional(),
        expertLevel: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.JobExpertLevel))
            .optional()
            .messages({
            'any.only': 'Invalid expert level, must be one of: ' + Object.values(jobs_enum_1.JobExpertLevel).join(', '),
        }),
        milestones: joi_1.default.array()
            .items(joi_1.default.object({
            timeFrame: joi_1.default.object({
                number: joi_1.default.number().optional(),
                period: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobPeriod)).optional(),
            }).optional(),
            achievement: joi_1.default.string().optional(),
            amount: joi_1.default.number().optional(),
        }))
            .max(5)
            .optional(),
        maximumPrice: joi_1.default.number().optional(),
        bidRange: joi_1.default.number().optional(),
        budget: joi_1.default.number().optional(),
        achievementDetails: joi_1.default.string().optional(),
        currency: joi_1.default.string().optional(),
    });
    const { error } = updateJobValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateUpdateJob = validateUpdateJob;
const validateProjectApplication = (req, res, next) => {
    const projectValidation = joi_1.default.object({
        jobId: joi_1.default.string().required().messages({
            'string.empty': 'Job ID is required',
        }),
        businessId: joi_1.default.string().required().messages({
            'string.empty': 'Business ID is required',
        }),
        type: joi_1.default.string().valid('biddable', 'regular').required().messages({
            'any.only': 'Invalid job type, must be "biddable" or "regular"',
            'any.required': 'Job type is required',
        }),
        maximumPrice: joi_1.default.when('type', {
            is: 'biddable',
            then: joi_1.default.number().required().messages({
                'number.base': 'Maximum price must be a number',
                'any.required': 'Maximum price is required for biddable jobs',
            }),
            otherwise: joi_1.default.forbidden(),
        }),
        milestones: joi_1.default.when('type', {
            is: 'biddable',
            then: joi_1.default.array().items(joi_1.default.object({
                milestoneId: joi_1.default.string().required().messages({
                    'string.empty': 'Milestone ID is required',
                }),
                amount: joi_1.default.number().required().messages({
                    'number.base': 'Amount must be a number',
                    'any.required': 'Amount is required',
                }),
                achievement: joi_1.default.string().required().messages({
                    'string.empty': 'Achievement is required',
                }),
            })).min(1).required().messages({
                'array.min': 'At least one milestone is required',
            }),
            otherwise: joi_1.default.forbidden(),
        }),
    });
    const { error } = projectValidation.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }
    next();
};
exports.validateProjectApplication = validateProjectApplication;
const validateMilestoneStatusUpdate = (req, res, next) => {
    const milestoneValidation = joi_1.default.object({
        status: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.MilestoneEnum))
            .required()
            .messages({
            'any.only': `Invalid status, must be one of: ${Object.values(jobs_enum_1.MilestoneEnum).join(', ')}`,
            'any.required': 'Status is required',
        }),
    });
    const { error } = milestoneValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateMilestoneStatusUpdate = validateMilestoneStatusUpdate;
const validatePostQuote = (req, res, next) => {
    const quoteValidation = joi_1.default.object({
        totalAmount: joi_1.default.number().required().messages({
            'number.empty': 'Total amount must be a number',
            'any.required': 'Total amount is required',
        }),
        jobId: joi_1.default.string().required().messages({
            'string.empty': 'Job ID must be a string',
            'any.required': 'Job ID is required',
        }),
        milestones: joi_1.default.array()
            .items(joi_1.default.object({
            milestoneId: joi_1.default.string().required().messages({
                'string.empty': 'Milestone ID must be a string',
                'any.required': 'Milestone ID is required',
            }),
            amount: joi_1.default.number().required().messages({
                'number.base': 'Amount must be a number',
                'any.required': 'Amount is required',
            }),
            achievement: joi_1.default.string().required().messages({
                'string.empty': 'Achievement must be a string',
                'any.required': 'Achievement is required',
            }),
        }))
            .min(1)
            .required()
            .messages({
            'array.min': 'At least one milestone is required',
            'any.required': 'Milestones are required',
        }),
    });
    const { error } = quoteValidation.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
        return;
    }
    next();
};
exports.validatePostQuote = validatePostQuote;
const validateUpdateMilestonePayment = (req, res, next) => {
    const milestoneValidation = joi_1.default.object({
        amountPaid: joi_1.default.number().required().messages({
            'number.empty': 'Amount Paid must be a number',
            'any.required': 'Amount Paid is required',
        }),
        jobId: joi_1.default.string().required().messages({
            'string.empty': 'Job ID must be a string',
            'any.required': 'Job ID is required',
        }),
        milestoneId: joi_1.default.string().required().messages({
            'string.empty': 'Milestone ID must be a string',
            'any.required': 'Milestone ID  ID is required',
        }),
        paymentMethod: joi_1.default.string().required().messages({
            'string.empty': 'Payment Method must be a string',
            'any.required': 'Payment Method   is required',
        }),
        date: joi_1.default.string().required().messages({
            'string.empty': 'Payment Date must be a string ',
            'any.required': 'Payment Date   is required',
        }),
        note: joi_1.default.string().optional().messages({
            'string.empty': 'Note must be a string',
        }),
    });
    const { error } = milestoneValidation.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
        return;
    }
    next();
};
exports.validateUpdateMilestonePayment = validateUpdateMilestonePayment;
