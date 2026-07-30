"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRecurringJob = exports.validateUpdateMilestonePayment = exports.validatePostQuote = exports.validateMilestoneStatusUpdate = exports.validateProjectApplication = exports.validateUpdateJob = exports.validateJob = void 0;
const joi_1 = __importDefault(require("joi"));
const jobs_enum_1 = require("../enums/jobs.enum");
// ===================== SHARED REUSABLE SCHEMAS =====================
const locationSchema = joi_1.default.object({
    address: joi_1.default.string().required().messages({
        'string.empty': 'Location address is required',
        'any.required': 'Location address is required',
    }),
    lat: joi_1.default.number().optional(),
    lng: joi_1.default.number().optional(),
});
const budgetSchema = joi_1.default.object({
    currency: joi_1.default.string().required().messages({
        'string.empty': 'Currency is required',
        'any.required': 'Currency is required',
    }),
    amount: joi_1.default.number().positive().required().messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be a positive number',
        'any.required': 'Amount is required',
    }),
});
const recurringBudgetSchema = budgetSchema.keys({
    period: joi_1.default.string()
        .valid(...Object.values(jobs_enum_1.JobFrequencyEnum))
        .required()
        .messages({
        'any.only': 'Invalid recurring period, must be one of: ' + Object.values(jobs_enum_1.JobFrequencyEnum).join(', '),
        'any.required': 'Recurring period is required',
    }),
});
const jobScheduleSchema = joi_1.default.object({
    startDate: joi_1.default.date().required().messages({
        'date.base': 'Schedule start date must be a valid date',
        'any.required': 'Schedule start date is required',
    }),
    endDate: joi_1.default.date().optional().min(joi_1.default.ref('startDate')).messages({
        'date.base': 'Schedule end date must be a valid date',
        'date.min': 'Schedule end date must be after start date',
    }),
});
const jobDurationSchema = joi_1.default.object({
    value: joi_1.default.number().positive().required().messages({
        'number.base': 'Duration value must be a number',
        'number.positive': 'Duration value must be a positive number',
        'any.required': 'Duration value is required',
    }),
    unit: joi_1.default.string()
        .valid(...Object.values(jobs_enum_1.DurationUnitEnum))
        .required()
        .messages({
        'any.only': 'Invalid duration unit, must be one of: ' + Object.values(jobs_enum_1.DurationUnitEnum).join(', '),
        'any.required': 'Duration unit is required',
    }),
});
// Forbidden schemas (used when a block should NOT be present)
const forbiddenString = joi_1.default.any().forbidden().messages({ 'any.unknown': 'This field is not allowed for the selected job urgency' });
const forbiddenObject = joi_1.default.any().forbidden().messages({ 'any.unknown': 'This field is not allowed for the selected job urgency' });
const forbiddenArray = joi_1.default.array().forbidden().messages({ 'any.unknown': 'This field is not allowed for the selected job urgency' });
// ===================== CREATE JOB VALIDATION =====================
const validateJob = (req, res, next) => {
    const jobValidation = joi_1.default.object({
        // ===== Shared fields (required for all) =====
        jobCategory: joi_1.default.string().required().messages({
            'string.empty': 'Job category is required',
            'any.required': 'Job category is required',
        }),
        service: joi_1.default.string().required().messages({
            'string.empty': 'Service is required',
            'any.required': 'Service is required',
        }),
        title: joi_1.default.string().required().messages({
            'string.empty': 'Title is required',
            'any.required': 'Title is required',
        }),
        description: joi_1.default.string().required().messages({
            'string.empty': 'Description is required',
            'any.required': 'Description is required',
        }),
        images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each image must be a string (URL)',
        }),
        jobUrgency: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.JobUrgencyEnum))
            .required()
            .messages({
            'any.only': 'Invalid job urgency, must be one of: ' + Object.values(jobs_enum_1.JobUrgencyEnum).join(', '),
            'any.required': 'Job urgency is required',
        }),
        location: locationSchema.required().messages({
            'any.required': 'Location is required',
        }),
        allowBidding: joi_1.default.boolean().required().messages({
            'boolean.base': 'Allow bidding must be true or false',
            'any.required': 'Allow bidding is required',
        }),
        experienceLevel: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.ExperienceLevelEnum))
            .required()
            .messages({
            'any.only': 'Invalid experience level, must be one of: ' + Object.values(jobs_enum_1.ExperienceLevelEnum).join(', '),
            'any.required': 'Experience level is required',
        }),
        expertId: joi_1.default.string().optional().allow('').messages({
            'string.base': 'Expert ID must be a string',
        }),
        // ===== Conditional fields based on jobUrgency =====
        // right_now block
        jobDuration: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.right_now,
            then: jobDurationSchema.required().messages({
                'any.required': 'Job duration is required for immediate jobs',
            }),
            otherwise: forbiddenObject,
        }),
        totalBudget: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.right_now,
            then: budgetSchema.required().messages({
                'any.required': 'Total budget is required for immediate jobs',
            }),
            otherwise: forbiddenObject,
        }),
        // in_future block
        jobSchedule: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.in_future,
            then: jobScheduleSchema.required().messages({
                'any.required': 'Job schedule is required for future jobs',
            }),
            otherwise: forbiddenObject,
        }),
        estimatedBudget: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.in_future,
            then: budgetSchema.required().messages({
                'any.required': 'Estimated budget is required for future jobs',
            }),
            otherwise: forbiddenObject,
        }),
        // regularly block
        jobFrequency: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.regularly,
            then: joi_1.default.string()
                .valid(...Object.values(jobs_enum_1.JobFrequencyEnum))
                .required()
                .messages({
                'any.only': 'Invalid job frequency, must be one of: ' + Object.values(jobs_enum_1.JobFrequencyEnum).join(', '),
                'any.required': 'Job frequency is required for recurring jobs',
            }),
            otherwise: forbiddenString,
        }),
        startDate: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.regularly,
            then: joi_1.default.date().required().messages({
                'date.base': 'Start date must be a valid date',
                'any.required': 'Start date is required for recurring jobs',
            }),
            otherwise: joi_1.default.any().forbidden().messages({ 'any.unknown': 'Start date is only allowed for recurring jobs' }),
        }),
        endDate: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.regularly,
            then: joi_1.default.date().optional().min(joi_1.default.ref('startDate')).messages({
                'date.base': 'End date must be a valid date',
                'date.min': 'End date must be after start date',
            }),
            otherwise: joi_1.default.any().forbidden().messages({ 'any.unknown': 'End date is only allowed for recurring jobs' }),
        }),
        recurringBudget: joi_1.default.when('jobUrgency', {
            is: jobs_enum_1.JobUrgencyEnum.regularly,
            then: recurringBudgetSchema.required().messages({
                'any.required': 'Recurring budget is required for recurring jobs',
            }),
            otherwise: forbiddenObject,
        }),
        // ===== Old fields kept for backward compatibility (all optional) =====
        category: joi_1.default.string().optional(),
        type: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobType)).optional(),
        budget: joi_1.default.number().optional(),
        duration: joi_1.default.object({
            number: joi_1.default.number().optional(),
            period: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobPeriod)).optional(),
        }).optional(),
        expertLevel: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobExpertLevel)).optional(),
        jobFiles: joi_1.default.array().items(joi_1.default.string()).optional(),
        maximumPrice: joi_1.default.number().optional(),
        bidRange: joi_1.default.number().optional(),
        achievementDetails: joi_1.default.string().optional(),
        currency: joi_1.default.string().optional(),
        milestones: joi_1.default.array().items(joi_1.default.object({
            timeFrame: joi_1.default.object({
                number: joi_1.default.number().optional(),
                period: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobPeriod)).optional(),
            }).optional(),
            achievement: joi_1.default.string().optional(),
            amount: joi_1.default.number().optional(),
        })).optional(),
        userName: joi_1.default.string().optional(),
        email: joi_1.default.string().optional(),
        identifier: joi_1.default.string().optional(),
        artisan: joi_1.default.string().optional(),
    });
    const { error } = jobValidation.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateJob = validateJob;
// ===================== UPDATE JOB VALIDATION =====================
const validateUpdateJob = (req, res, next) => {
    const updateJobValidation = joi_1.default.object({
        // Shared fields (all optional for update)
        jobCategory: joi_1.default.string().optional(),
        service: joi_1.default.string().optional(),
        title: joi_1.default.string().optional(),
        description: joi_1.default.string().optional(),
        images: joi_1.default.array().items(joi_1.default.string()).optional(),
        jobUrgency: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.JobUrgencyEnum))
            .optional()
            .messages({
            'any.only': 'Invalid job urgency, must be one of: ' + Object.values(jobs_enum_1.JobUrgencyEnum).join(', '),
        }),
        location: locationSchema.optional(),
        allowBidding: joi_1.default.boolean().optional(),
        experienceLevel: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.ExperienceLevelEnum))
            .optional()
            .messages({
            'any.only': 'Invalid experience level, must be one of: ' + Object.values(jobs_enum_1.ExperienceLevelEnum).join(', '),
        }),
        expertId: joi_1.default.string().optional().allow(''),
        // Conditional fields - only allowed based on jobUrgency
        // We use .when() on jobUrgency which may or may not be present in the update
        // If jobUrgency is provided, enforce the block rules
        // If not provided, allow the fields to be present (the pre-save hook will sanitize)
        jobDuration: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.right_now,
                then: jobDurationSchema.optional(),
                otherwise: forbiddenObject,
            }),
            otherwise: jobDurationSchema.optional(),
        }),
        totalBudget: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.right_now,
                then: budgetSchema.optional(),
                otherwise: forbiddenObject,
            }),
            otherwise: budgetSchema.optional(),
        }),
        jobSchedule: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.in_future,
                then: jobScheduleSchema.optional(),
                otherwise: forbiddenObject,
            }),
            otherwise: jobScheduleSchema.optional(),
        }),
        estimatedBudget: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.in_future,
                then: budgetSchema.optional(),
                otherwise: forbiddenObject,
            }),
            otherwise: budgetSchema.optional(),
        }),
        jobFrequency: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.regularly,
                then: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobFrequencyEnum)).optional(),
                otherwise: forbiddenString,
            }),
            otherwise: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobFrequencyEnum)).optional(),
        }),
        startDate: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.regularly,
                then: joi_1.default.date().optional(),
                otherwise: joi_1.default.any().forbidden().messages({ 'any.unknown': 'Start date is only allowed for recurring jobs' }),
            }),
            otherwise: joi_1.default.date().optional(),
        }),
        endDate: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.regularly,
                then: joi_1.default.date().optional().min(joi_1.default.ref('startDate')).messages({
                    'date.min': 'End date must be after start date',
                }),
                otherwise: joi_1.default.any().forbidden().messages({ 'any.unknown': 'End date is only allowed for recurring jobs' }),
            }),
            otherwise: joi_1.default.date().optional(),
        }),
        recurringBudget: joi_1.default.when('jobUrgency', {
            is: joi_1.default.exist(),
            then: joi_1.default.when('jobUrgency', {
                is: jobs_enum_1.JobUrgencyEnum.regularly,
                then: recurringBudgetSchema.optional(),
                otherwise: forbiddenObject,
            }),
            otherwise: recurringBudgetSchema.optional(),
        }),
        // ===== Old fields kept for backward compatibility =====
        category: joi_1.default.string().optional(),
        type: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobType)).optional(),
        budget: joi_1.default.number().optional(),
        duration: joi_1.default.object({
            number: joi_1.default.number().optional(),
            period: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobPeriod)).optional(),
        }).optional(),
        expertLevel: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobExpertLevel)).optional(),
        jobFiles: joi_1.default.array().items(joi_1.default.string()).optional(),
        maximumPrice: joi_1.default.number().optional(),
        bidRange: joi_1.default.number().optional(),
        achievementDetails: joi_1.default.string().optional(),
        currency: joi_1.default.string().optional(),
        milestones: joi_1.default.array()
            .items(joi_1.default.object({
            timeFrame: joi_1.default.object({
                number: joi_1.default.number().optional(),
                period: joi_1.default.string().valid(...Object.values(jobs_enum_1.JobPeriod)).optional(),
            }).optional(),
            achievement: joi_1.default.string().optional(),
            amount: joi_1.default.number().optional(),
        }))
            .optional(),
    });
    const { error } = updateJobValidation.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateUpdateJob = validateUpdateJob;
// ===================== OTHER VALIDATORS (KEPT AS-IS) =====================
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
        additionalAmount: joi_1.default.number().optional().allow("").messages({
            'number.base': 'Additional amount must be a number',
        }),
        note: joi_1.default.string().optional().allow("").messages({
            'string.base': 'Note must be a string',
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
const validateRecurringJob = (req, res, next) => {
    const jobValidation = joi_1.default.object({
        jobId: joi_1.default.string().optional(),
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
        budget: joi_1.default.number().required().messages({
            'number.base': 'Budget must be a number',
            'any.required': 'Budget is required for regular or direct jobs',
        }),
        achievementDetails: joi_1.default.string().messages({
            'string.empty': 'Achievement details must be a string',
        }),
        currency: joi_1.default.string().messages({
            'string.empty': 'Currency must be a string',
        }),
        artisan: joi_1.default.string().optional().messages({
            'string.base': 'Artisan must be a string',
        }),
        frequency: joi_1.default.string()
            .valid(...Object.values(jobs_enum_1.FrequencyEnum))
            .required()
            .messages({
            'any.only': 'Frequency, must be one of: ' + Object.values(jobs_enum_1.FrequencyEnum).join(', '),
            'any.required': 'Frequency  is required',
        }),
        startDate: joi_1.default.date().required().messages({
            'date.base': 'Start date must be a date',
            'any.required': 'Start date is required',
        }),
        endDate: joi_1.default.date().required().messages({
            'date.base': 'End date must be a date',
            'any.required': 'End date is required',
        }),
        reminderDates: joi_1.default.array().items(joi_1.default.object({
            day: joi_1.default.string()
        })),
    });
    const { error } = jobValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateRecurringJob = validateRecurringJob;
