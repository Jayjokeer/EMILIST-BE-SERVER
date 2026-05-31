import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateBusinessRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const profileSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    countryCode: Joi.string().optional(),
    mobile: Joi.string().optional(),
    language: Joi.string().optional(),
    houseAddress: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    bio: Joi.string().optional(),
  });

  const certificationSchema = Joi.object({
    issuingOrganisation: Joi.string().optional(),
    verificationNumber: Joi.string().optional(),
    issuingDate: Joi.date().optional(),
    expiringDate: Joi.date().optional(),
    isCertificateExpire: Joi.boolean().optional(),
    isVerified: Joi.boolean().optional(),
    certificate: Joi.string().optional(),
  });

  const membershipSchema = Joi.object({
    organisation: Joi.string().optional(),
    positionHeld: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    isMembershipExpire: Joi.boolean().optional(),
  });

  const insuranceSchema = Joi.object({
    issuingOrganisation: Joi.string().optional(),
    coverage: Joi.string().optional(),
    description: Joi.string().optional(),
  });

  const businessSchema = Joi.object({
    services: Joi.array().items(Joi.string()).required(),
    coverageArea: Joi.array().items(Joi.string()).required(),

    businessName: Joi.string().required(),
    yearFounded: Joi.string().required(),
    numberOfEmployee: Joi.number().required(),

    businessAddress: Joi.string().required(),
    businessState: Joi.string().required(),
    businessCountry: Joi.string().required(),

    startingPrice: Joi.number().required(),
    currency: Joi.string().required(),
    rateUnit: Joi.string().required(),
    noticePeriod: Joi.string().required(),
    businessDescription: Joi.string().required(),

    businessImages: Joi.array().items(Joi.string()).optional(),

    certifications: Joi.array().items(certificationSchema).optional(),
    memberships: Joi.array().items(membershipSchema).optional(),
    insurances: Joi.array().items(insuranceSchema).optional(),
  });

  const schema = Joi.object({
    profile: profileSchema.required(),
    business: businessSchema.required(),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((d) => d.message),
    });
  }

  next();
};

  export const validateBusinessUpdate = (req: Request, res: Response, next: NextFunction) => {
    const businessValidation = Joi.object({
      currency: Joi.string().optional().messages({
        'string.base': 'Currency must be a string',
      }),
      coverageArea: Joi.array().items(Joi.string()).optional().messages({
        'string.base': 'Each coverage area must be a string',
      }),
      renderedServices: Joi.array().items(
        Joi.object({
        id: Joi.string().optional().messages({
                'string.base': 'Rendered Service ID must be a string',
              }),
          name: Joi.string().optional().messages({
            'string.empty': 'Service name cannot be empty',
          }),
          status: Joi.string().optional().messages({
            'string.base': 'Status must be a string',
          }),
        })
      ).optional(),
      certification: Joi.array().items(
        Joi.object({
          id: Joi.string().optional().messages({
            'string.base': 'Certification ID must be a string',
          }),
          issuingOrganisation: Joi.string().optional().messages({
            'string.base': 'Issuing organisation must be a string',
          }),
          verificationNumber: Joi.string().optional().messages({
            'string.base': 'Verification number must be a string',
          }),
          issuingDate: Joi.date().optional().messages({
            'date.base': 'Issuing date must be a valid date',
          }),
          expiringDate: Joi.date().optional().messages({
            'date.base': 'Expiring date must be a valid date',
          }),
          isCertificateExpire: Joi.boolean().optional().messages({
            'boolean.base': 'Certificate expiry must be a boolean',
          }),
        })
      ).optional(),
      membership: Joi.array().items(
        Joi.object({
          id: Joi.string().optional().messages({
            'string.base': 'Membership ID must be a string',
          }),
          organisation: Joi.string().optional().messages({
            'string.base': 'Organisation must be a string',
          }),
          positionHeld: Joi.string().optional().messages({
            'string.base': 'Position held must be a string',
          }),
          startDate: Joi.date().optional().messages({
            'date.base': 'Start date must be a valid date',
          }),
          endDate: Joi.date().optional().messages({
            'date.base': 'End date must be a valid date',
          }),
          isMembershipExpire: Joi.boolean().optional().messages({
            'boolean.base': 'Membership expiry must be a boolean',
          }),
        })
      ).optional(),
      insurance: Joi.array().items(
        Joi.object({
          id: Joi.string().optional().messages({
            'string.base': 'Insurance ID must be a string',
          }),
          issuingOrganisation: Joi.string().optional().messages({
            'string.base': 'Issuing organisation must be a string',
          }),
          coverage: Joi.string().optional().messages({
            'string.base': 'Coverage must be a string',
          }),
          description: Joi.string().optional().messages({
            'string.base': 'Description must be a string',
          }),
        })
      ).optional(),
      businessName: Joi.string().optional().messages({
        'string.base': 'Business name must be a string',
      }),
      yearFounded: Joi.string().optional().messages({
        'string.base': 'Year founded must be a string',
      }),
      numberOfEmployee: Joi.number().optional().messages({
        'number.base': 'number of employees must be a number',
      }),
      businessAddress: Joi.string().optional().messages({
        'string.base': 'Business address must be a string',
      }),
      businessCity: Joi.string().optional().messages({
        'string.base': 'City must be a string',
      }),
      businessState: Joi.string().optional().messages({
        'string.base': 'State must be a string',
      }),
      businessCountry: Joi.string().optional().messages({
        'string.base': 'Country must be a string',
      }),
      startingPrice: Joi.number().optional().messages({
        'number.base': 'Starting price must be a number',
      }),
      noticePeriod: Joi.string().optional().messages({
        'string.base': 'Notice period must be a string',
      }),
      businessDescription: Joi.string().optional().messages({
        'string.base': 'Description must be a string',
      }),
    });
  
    const { error } = businessValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return;
    }
  
    next();
  };


  export const validateMarkBusinessReview = (req: Request, res: Response, next: NextFunction) => {
    const businessReviewValidation = Joi.object({
      isHelpful: Joi.boolean().required().messages({
        'boolean.empty': 'isHelpful cannot be empty',
        'boolean.base': 'isHelpful must be boolean'
      }),
      userId: Joi.string().optional().messages({
        'string.base': 'Last name must be a string',
      }),
    });
  
    const { error } = businessReviewValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return;
    }
  
    next();
  };

  export const validateReviewBusiness = (req: Request, res: Response, next: NextFunction) => {
    const businessCreateReviewValidation = Joi.object({
      businessId: Joi.string().required().messages({
        'string.empty': 'Business ID cannot be empty',
        'string.base': 'Business ID must be a string'
      }),
      comment: Joi.string().optional().messages({
        'string.base': 'Comment must be a string',
      }),
      rating: Joi.number().required().messages({
        'number.empty': 'Rating cannot be empty',
        'number.base': 'Rating must be a number'
      }),
    });
  
    const { error } = businessCreateReviewValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return;
    }
  
    next();
  };