import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { FrequencyEnum, JobExpertLevel, JobPeriod, JobType, MilestoneEnum, JobUrgencyEnum, JobFrequencyEnum, DurationUnitEnum, ExperienceLevelEnum } from '../enums/jobs.enum';

// ===================== SHARED REUSABLE SCHEMAS =====================

const locationSchema = Joi.object({
  address: Joi.string().required().messages({
    'string.empty': 'Location address is required',
    'any.required': 'Location address is required',
  }),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
});

const budgetSchema = Joi.object({
  currency: Joi.string().required().messages({
    'string.empty': 'Currency is required',
    'any.required': 'Currency is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
});

const recurringBudgetSchema = budgetSchema.keys({
  period: Joi.string()
    .valid(...Object.values(JobFrequencyEnum))
    .required()
    .messages({
      'any.only': 'Invalid recurring period, must be one of: ' + Object.values(JobFrequencyEnum).join(', '),
      'any.required': 'Recurring period is required',
    }),
});

const jobScheduleSchema = Joi.object({
  startDate: Joi.date().required().messages({
    'date.base': 'Schedule start date must be a valid date',
    'any.required': 'Schedule start date is required',
  }),
  endDate: Joi.date().optional().min(Joi.ref('startDate')).messages({
    'date.base': 'Schedule end date must be a valid date',
    'date.min': 'Schedule end date must be after start date',
  }),
});

const jobDurationSchema = Joi.object({
  value: Joi.number().positive().required().messages({
    'number.base': 'Duration value must be a number',
    'number.positive': 'Duration value must be a positive number',
    'any.required': 'Duration value is required',
  }),
  unit: Joi.string()
    .valid(...Object.values(DurationUnitEnum))
    .required()
    .messages({
      'any.only': 'Invalid duration unit, must be one of: ' + Object.values(DurationUnitEnum).join(', '),
      'any.required': 'Duration unit is required',
    }),
});

// Forbidden schemas (used when a block should NOT be present)
const forbiddenString = Joi.any().forbidden().messages({ 'any.unknown': 'This field is not allowed for the selected job urgency' });
const forbiddenObject = Joi.any().forbidden().messages({ 'any.unknown': 'This field is not allowed for the selected job urgency' });
const forbiddenArray = Joi.array().forbidden().messages({ 'any.unknown': 'This field is not allowed for the selected job urgency' });

// ===================== CREATE JOB VALIDATION =====================

export const validateJob = (req: Request, res: Response, next: NextFunction) => {
 const jobValidation = Joi.object({
  // ===== Shared fields (required for all) =====
  jobCategory: Joi.string().required().messages({
    'string.empty': 'Job category is required',
    'any.required': 'Job category is required',
  }),
  service: Joi.string().required().messages({
    'string.empty': 'Service is required',
    'any.required': 'Service is required',
  }),
  title: Joi.string().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required',
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  jobUrgency: Joi.string()
    .valid(...Object.values(JobUrgencyEnum))
    .required()
    .messages({
      'any.only': 'Invalid job urgency, must be one of: ' + Object.values(JobUrgencyEnum).join(', '),
      'any.required': 'Job urgency is required',
    }),
  location: locationSchema.required().messages({
    'any.required': 'Location is required',
  }),
  // Not collected for direct hire (jobs assigned via expertId) - the server
  // forces allowBidding=false and leaves experienceLevel unset in that flow.
  allowBidding: Joi.when('expertId', {
    is: Joi.string().trim().min(1).required(),
    then: Joi.boolean().optional(),
    otherwise: Joi.boolean().required().messages({
      'boolean.base': 'Allow bidding must be true or false',
      'any.required': 'Allow bidding is required',
    }),
  }),
  experienceLevel: Joi.when('expertId', {
    is: Joi.string().trim().min(1).required(),
    then: Joi.string().valid(...Object.values(ExperienceLevelEnum)).optional(),
    otherwise: Joi.string()
      .valid(...Object.values(ExperienceLevelEnum))
      .required()
      .messages({
        'any.only': 'Invalid experience level, must be one of: ' + Object.values(ExperienceLevelEnum).join(', '),
        'any.required': 'Experience level is required',
      }),
  }),
  expertId: Joi.string().optional().allow('').messages({
    'string.base': 'Expert ID must be a string',
  }),

  // ===== Conditional fields based on jobUrgency =====
  // right_now block
  jobDuration: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.right_now,
    then: jobDurationSchema.required().messages({
      'any.required': 'Job duration is required for immediate jobs',
    }),
    otherwise: forbiddenObject,
  }),
  totalBudget: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.right_now,
    then: budgetSchema.required().messages({
      'any.required': 'Total budget is required for immediate jobs',
    }),
    otherwise: forbiddenObject,
  }),

  // in_future block
  jobSchedule: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.in_future,
    then: jobScheduleSchema.required().messages({
      'any.required': 'Job schedule is required for future jobs',
    }),
    otherwise: forbiddenObject,
  }),
  estimatedBudget: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.in_future,
    then: budgetSchema.required().messages({
      'any.required': 'Estimated budget is required for future jobs',
    }),
    otherwise: forbiddenObject,
  }),

  // regularly block
  jobFrequency: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.regularly,
    then: Joi.string()
      .valid(...Object.values(JobFrequencyEnum))
      .required()
      .messages({
        'any.only': 'Invalid job frequency, must be one of: ' + Object.values(JobFrequencyEnum).join(', '),
        'any.required': 'Job frequency is required for recurring jobs',
      }),
    otherwise: forbiddenString,
  }),
  startDate: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.regularly,
    then: Joi.date().required().messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required for recurring jobs',
    }),
    otherwise: Joi.any().forbidden().messages({ 'any.unknown': 'Start date is only allowed for recurring jobs' }),
  }),
  endDate: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.regularly,
    then: Joi.date().optional().min(Joi.ref('startDate')).messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date',
    }),
    otherwise: Joi.any().forbidden().messages({ 'any.unknown': 'End date is only allowed for recurring jobs' }),
  }),
  recurringBudget: Joi.when('jobUrgency', {
    is: JobUrgencyEnum.regularly,
    then: recurringBudgetSchema.required().messages({
      'any.required': 'Recurring budget is required for recurring jobs',
    }),
    otherwise: forbiddenObject,
  }),

  // ===== Old fields kept for backward compatibility (all optional) =====
  category: Joi.string().optional(),
  type: Joi.string().valid(...Object.values(JobType)).optional(),
  budget: Joi.number().optional(),
  duration: Joi.object({
    number: Joi.number().optional(),
    period: Joi.string().valid(...Object.values(JobPeriod)).optional(),
  }).optional(),
  expertLevel: Joi.string().valid(...Object.values(JobExpertLevel)).optional(),
  jobFiles: Joi.array().items(Joi.string()).optional(),
  maximumPrice: Joi.number().optional(),
  bidRange: Joi.number().optional(),
  achievementDetails: Joi.string().optional(),
  currency: Joi.string().optional(),
  milestones: Joi.array().items(Joi.object({
    timeFrame: Joi.object({
      number: Joi.number().positive().required().messages({
        'number.base': 'Milestone duration must be a number',
        'number.positive': 'Milestone duration must be a positive number',
        'any.required': 'Milestone duration is required',
      }),
      period: Joi.string().valid(...Object.values(JobPeriod)).required().messages({
        'any.only': 'Invalid milestone duration unit, must be one of: ' + Object.values(JobPeriod).join(', '),
        'any.required': 'Milestone duration unit is required',
      }),
    }).required().messages({
      'any.required': 'Milestone duration is required',
    }),
    achievement: Joi.string().required().messages({
      'string.empty': 'Milestone achievement details are required',
      'any.required': 'Milestone achievement details are required',
    }),
    amount: Joi.number().positive().required().messages({
      'number.base': 'Milestone payment amount must be a number',
      'number.positive': 'Milestone payment amount must be a positive number',
      'any.required': 'Milestone payment amount is required',
    }),
    currency: Joi.string().optional(),
  })).max(5).optional().messages({
    'array.max': 'Cannot have more than 5 milestones',
  }),
  userName: Joi.string().optional(),
  email: Joi.string().optional(),
  identifier: Joi.string().optional(),
  artisan: Joi.string().optional(),
 });

 const { error } = jobValidation.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return;
  }

  next();
}


// ===================== UPDATE JOB VALIDATION =====================

export const validateUpdateJob = (req: Request, res: Response, next: NextFunction) => {
  const updateJobValidation = Joi.object({
    // Shared fields (all optional for update)
    jobCategory: Joi.string().optional(),
    service: Joi.string().optional(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    images: Joi.array().items(Joi.string()).optional(),
    jobUrgency: Joi.string()
      .valid(...Object.values(JobUrgencyEnum))
      .optional()
      .messages({
        'any.only': 'Invalid job urgency, must be one of: ' + Object.values(JobUrgencyEnum).join(', '),
      }),
    location: locationSchema.optional(),
    allowBidding: Joi.boolean().optional(),
    experienceLevel: Joi.string()
      .valid(...Object.values(ExperienceLevelEnum))
      .optional()
      .messages({
        'any.only': 'Invalid experience level, must be one of: ' + Object.values(ExperienceLevelEnum).join(', '),
      }),
    expertId: Joi.string().optional().allow(''),

    // Conditional fields - only allowed based on jobUrgency
    // We use .when() on jobUrgency which may or may not be present in the update
    // If jobUrgency is provided, enforce the block rules
    // If not provided, allow the fields to be present (the pre-save hook will sanitize)
    jobDuration: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.right_now,
        then: jobDurationSchema.optional(),
        otherwise: forbiddenObject,
      }),
      otherwise: jobDurationSchema.optional(),
    }),
    totalBudget: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.right_now,
        then: budgetSchema.optional(),
        otherwise: forbiddenObject,
      }),
      otherwise: budgetSchema.optional(),
    }),
    jobSchedule: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.in_future,
        then: jobScheduleSchema.optional(),
        otherwise: forbiddenObject,
      }),
      otherwise: jobScheduleSchema.optional(),
    }),
    estimatedBudget: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.in_future,
        then: budgetSchema.optional(),
        otherwise: forbiddenObject,
      }),
      otherwise: budgetSchema.optional(),
    }),
    jobFrequency: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.regularly,
        then: Joi.string().valid(...Object.values(JobFrequencyEnum)).optional(),
        otherwise: forbiddenString,
      }),
      otherwise: Joi.string().valid(...Object.values(JobFrequencyEnum)).optional(),
    }),
    startDate: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.regularly,
        then: Joi.date().optional(),
        otherwise: Joi.any().forbidden().messages({ 'any.unknown': 'Start date is only allowed for recurring jobs' }),
      }),
      otherwise: Joi.date().optional(),
    }),
    endDate: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.regularly,
        then: Joi.date().optional().min(Joi.ref('startDate')).messages({
          'date.min': 'End date must be after start date',
        }),
        otherwise: Joi.any().forbidden().messages({ 'any.unknown': 'End date is only allowed for recurring jobs' }),
      }),
      otherwise: Joi.date().optional(),
    }),
    recurringBudget: Joi.when('jobUrgency', {
      is: Joi.exist(),
      then: Joi.when('jobUrgency', {
        is: JobUrgencyEnum.regularly,
        then: recurringBudgetSchema.optional(),
        otherwise: forbiddenObject,
      }),
      otherwise: recurringBudgetSchema.optional(),
    }),

    // ===== Old fields kept for backward compatibility =====
    category: Joi.string().optional(),
    type: Joi.string().valid(...Object.values(JobType)).optional(),
    budget: Joi.number().optional(),
    duration: Joi.object({
      number: Joi.number().optional(),
      period: Joi.string().valid(...Object.values(JobPeriod)).optional(),
    }).optional(),
    expertLevel: Joi.string().valid(...Object.values(JobExpertLevel)).optional(),
    jobFiles: Joi.array().items(Joi.string()).optional(),
    maximumPrice: Joi.number().optional(),
    bidRange: Joi.number().optional(),
    achievementDetails: Joi.string().optional(),
    currency: Joi.string().optional(),
    milestones: Joi.array()
      .items(
        Joi.object({
          timeFrame: Joi.object({
            number: Joi.number().positive().optional(),
            period: Joi.string().valid(...Object.values(JobPeriod)).optional(),
          }).optional(),
          achievement: Joi.string().optional(),
          amount: Joi.number().positive().optional(),
          currency: Joi.string().optional(),
        })
      )
      .max(5)
      .messages({
        'array.max': 'Cannot have more than 5 milestones',
      })
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

// ===================== OTHER VALIDATORS (KEPT AS-IS) =====================

export const validateProjectApplication = (req: Request, res: Response, next: NextFunction) => {
  const projectValidation = Joi.object({
    jobId: Joi.string().required().messages({
      'string.empty': 'Job ID is required',
    }),
    businessId: Joi.string().required().messages({
      'string.empty': 'Business ID is required',
    }),
    type: Joi.string().valid('biddable', 'regular').required().messages({
      'any.only': 'Invalid job type, must be "biddable" or "regular"',
      'any.required': 'Job type is required',
    }),
    maximumPrice: Joi.when('type', {
      is: 'biddable',
      then: Joi.number().required().messages({
        'number.base': 'Maximum price must be a number',
        'any.required': 'Maximum price is required for biddable jobs',
      }),
      otherwise: Joi.forbidden(),
    }),
    milestones: Joi.when('type', {
      is: 'biddable',
      then: Joi.array().items(
        Joi.object({
          milestoneId: Joi.string().required().messages({
            'string.empty': 'Milestone ID is required',
          }),
          amount: Joi.number().required().messages({
            'number.base': 'Amount must be a number',
            'any.required': 'Amount is required',
          }),
          achievement: Joi.string().required().messages({
            'string.empty': 'Achievement is required',
          }),
        })
      ).min(1).required().messages({
        'array.min': 'At least one milestone is required',
      }),
      otherwise: Joi.forbidden(),
    }),
  });

  const { error } = projectValidation.validate(req.body);
  if (error) {
     res.status(400).json({ message: error.details[0].message });
     return;
  }
  next();
};

export const validateMilestoneStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  const milestoneValidation = Joi.object({
    status: Joi.string()
      .valid(...Object.values(MilestoneEnum))
      .required()
      .messages({
        'any.only': `Invalid status, must be one of: ${Object.values(MilestoneEnum).join(', ')}`,
        'any.required': 'Status is required',
      }),
      additionalAmount: Joi.number().optional().allow("").messages({
        'number.base': 'Additional amount must be a number',
      }),
      note: Joi.string().optional().allow("").messages({
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
export const validatePostQuote = (req: Request, res: Response, next: NextFunction) => {
  const quoteValidation = Joi.object({
    totalAmount: Joi.number().required().messages({
      'number.empty': 'Total amount must be a number',
      'any.required': 'Total amount is required',
    }),
    jobId: Joi.string().required().messages({
      'string.empty': 'Job ID must be a string',
      'any.required': 'Job ID is required',
    }),
    milestones: Joi.array()
      .items(
        Joi.object({
          milestoneId: Joi.string().required().messages({
            'string.empty': 'Milestone ID must be a string',
            'any.required': 'Milestone ID is required',
          }),
          amount: Joi.number().required().messages({
            'number.base': 'Amount must be a number',
            'any.required': 'Amount is required',
          }),
          achievement: Joi.string().required().messages({
            'string.empty': 'Achievement must be a string',
            'any.required': 'Achievement is required',
          }),
        })
      )
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
export const validateUpdateMilestonePayment= (req: Request, res: Response, next: NextFunction) => {
  const milestoneValidation = Joi.object({
    amountPaid: Joi.number().required().messages({
      'number.empty': 'Amount Paid must be a number',
      'any.required': 'Amount Paid is required',
    }),
    jobId: Joi.string().required().messages({
      'string.empty': 'Job ID must be a string',
      'any.required': 'Job ID is required',
    }),
    milestoneId: Joi.string().required().messages({
      'string.empty': 'Milestone ID must be a string',
      'any.required': 'Milestone ID  ID is required',
    }),
    paymentMethod: Joi.string().required().messages({
      'string.empty': 'Payment Method must be a string',
      'any.required': 'Payment Method   is required',
    }),
   date: Joi.string().required().messages({
      'string.empty': 'Payment Date must be a string ',
      'any.required': 'Payment Date   is required',
    }),
    note: Joi.string().optional().messages({
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

export const validateRecurringJob = (req: Request, res: Response, next: NextFunction) => {
  const jobValidation = Joi.object({
    jobId: Joi.string().optional(),
   category: Joi.string().required().messages({
     'string.empty': 'Category is required',
   }),
   service: Joi.string().required().messages({
     'string.empty': 'Service is required',
   }),
   title: Joi.string().required().messages({
     'string.empty': 'Title is required',
   }),
   description: Joi.string().required().messages({
     'string.empty': 'Description is required',
   }),
   jobFiles: Joi.array().items(Joi.string()).messages({
     'string.base': 'Each job file must be a string (URL or file path)',
   }),
   duration: Joi.object({
     number: Joi.number().required().messages({
       'number.base': 'Duration number must be a number',
       'any.required': 'Duration number is required',
     }),
     period: Joi.string()
       .valid(...Object.values(JobPeriod)) 
       .required()
       .messages({
         'any.only': 'Invalid period, must be one of: ' + Object.values(JobPeriod).join(', '),
         'any.required': 'Duration period is required',
       }),
   }).required(),
   location: Joi.string().required().messages({
     'string.empty': 'Location is required',
   }),
   expertLevel: Joi.string()
     .valid(...Object.values(JobExpertLevel)) 
     .required()
     .messages({
       'any.only': 'Invalid expert level, must be one of: ' + Object.values(JobExpertLevel).join(', '),
       'any.required': 'Expert level is required',
     }),
   milestones: Joi.array().items(Joi.object({
     timeFrame: Joi.object({
           number: Joi.number().required(),
           period: Joi.string().valid(...Object.values(JobPeriod)).required(),
         }).required(),
     achievement: Joi.string().required(),
     amount: Joi.number().required(),
       })).max(5).required(),
   budget: Joi.number().required().messages({
       'number.base': 'Budget must be a number',
       'any.required': 'Budget is required for regular or direct jobs',
     }),
   achievementDetails: Joi.string().messages({
     'string.empty': 'Achievement details must be a string',
   }),
   currency: Joi.string().messages({
     'string.empty': 'Currency must be a string',
   }),
   artisan: Joi.string().optional().messages({
     'string.base': 'Artisan must be a string',
   }),
   frequency: Joi.string()
   .valid(...Object.values(FrequencyEnum)) 
   .required()
   .messages({
     'any.only': 'Frequency, must be one of: ' + Object.values(FrequencyEnum).join(', '),
     'any.required': 'Frequency  is required',
   }),
   startDate: Joi.date().required().messages({
    'date.base': 'Start date must be a date',
    'any.required': 'Start date is required',
  }),
    endDate: Joi.date().required().messages({
    'date.base': 'End date must be a date',
    'any.required': 'End date is required',
  }),
  reminderDates: Joi.array().items(Joi.object({
    day: Joi.string()
 })),
});
 
 const { error } = jobValidation.validate(req.body, { abortEarly: false });
 
   if (error) {
     const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({ errors: errorMessages });
      return;
   }
 
   next();
 }