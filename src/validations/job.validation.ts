import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { JobExpertLevel, JobPeriod, JobType, MilestoneEnum } from '../enums/jobs.enum';

export const validateJob = (req: Request, res: Response, next: NextFunction) => {
 const jobValidation = Joi.object({
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
  type: Joi.string()
    .valid(...Object.values(JobType)) 
    .required()
    .messages({
      'any.only': 'Invalid job type, must be one of: ' + Object.values(JobType).join(', '),
      'any.required': 'Job type is required',
    }),
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
  maximumPrice: Joi.when('type', {
    is: 'biddable',
    then: Joi.number().required().messages({
      'number.base': 'Maximum price must be a number',
      'any.required': 'Maximum price is required for biddable jobs',
    }),
    otherwise: Joi.forbidden(),
  }),
  bidRange: Joi.when('type', {
    is: 'biddable',
    then: Joi.number().required().messages({
      'number.base': 'Bid range must be a number',
      'any.required': 'Bid range is required for biddable jobs',
    }),
    otherwise: Joi.forbidden(),
  }),
  budget: Joi.when('type', {
    is: Joi.string().valid('regular', 'direct'),
    then: Joi.number().required().messages({
      'number.base': 'Budget must be a number',
      'any.required': 'Budget is required for regular or direct jobs',
    }),
    otherwise: Joi.forbidden(),
  }),
  achievementDetails: Joi.string().messages({
    'string.empty': 'Achievement details must be a string',
  }),
  currency: Joi.string().messages({
    'string.empty': 'Currency must be a string',
  }),
  userName: Joi.string().optional().messages({
    'string.empty': 'UserName must be a string',
  }),
  email: Joi.string().optional().messages({
    'string.empty': 'Email must be a string',
  }),
});

const { error } = jobValidation.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return;
  }

  next();
}


export const validateUpdateJob = (req: Request, res: Response, next: NextFunction) => {
  const updateJobValidation = Joi.object({
    category: Joi.string().optional(),
    service: Joi.string().optional(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    jobFiles: Joi.array().items(Joi.string()).optional().messages({
      'string.base': 'Each job file must be a string (URL or file path)',
    }),
    duration: Joi.object({
      number: Joi.number().optional().messages({
        'number.base': 'Duration number must be a number',
      }),
      period: Joi.string()
        .valid(...Object.values(JobPeriod))
        .optional()
        .messages({
          'any.only': 'Invalid period, must be one of: ' + Object.values(JobPeriod).join(', '),
        }),
    }).optional(),
    type: Joi.string()
      .valid(...Object.values(JobType))
      .optional()
      .messages({
        'any.only': 'Invalid job type, must be one of: ' + Object.values(JobType).join(', '),
      }),
    location: Joi.string().optional(),
    expertLevel: Joi.string()
      .valid(...Object.values(JobExpertLevel))
      .optional()
      .messages({
        'any.only': 'Invalid expert level, must be one of: ' + Object.values(JobExpertLevel).join(', '),
      }),
    milestones: Joi.array()
      .items(
        Joi.object({
          timeFrame: Joi.object({
            number: Joi.number().optional(),
            period: Joi.string().valid(...Object.values(JobPeriod)).optional(),
          }).optional(),
          achievement: Joi.string().optional(),
          amount: Joi.number().optional(),
        })
      )
      .max(5)
      .optional(),
    maximumPrice: Joi.number().optional(),
    bidRange: Joi.number().optional(),
    budget: Joi.number().optional(),
    achievementDetails: Joi.string().optional(),
    currency: Joi.string().optional(),
  });

  const { error } = updateJobValidation.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
   res.status(400).json({ errors: errorMessages });
   return;
  }

  next();
};
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