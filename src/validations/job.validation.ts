import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { JobExpertLevel, JobPeriod, JobType } from '../enums/jobs.enum';

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
    is: 'regular',
    then: Joi.number().required().messages({
      'number.base': 'Budget must be a number',
      'any.required': 'Budget is required for regular jobs',
    }),
    otherwise: Joi.forbidden(),
  }),
  achievementDetails: Joi.string().messages({
    'string.empty': 'Achievement details must be a string',
  }),
  currency: Joi.string().messages({
    'string.empty': 'Currency must be a string',
  }),
});

const { error } = jobValidation.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
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
  }

  next();
};