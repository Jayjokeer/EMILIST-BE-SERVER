import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateBusinessRegistration = (req: Request, res: Response, next: NextFunction) => {
    const businessValidation = Joi.object({
      firstName: Joi.string().required().messages({
        'string.empty': 'First name is required',
      }),
      lastName: Joi.string().required().messages({
        'string.empty': 'Last name is required',
      }),
      services: Joi.array().items(Joi.string()).optional().messages({
        'string.base': 'Each service must be a string',
      }),
      languages: Joi.array().items(Joi.string()).optional().messages({
        'string.base': 'Each language must be a string',
      }),
      address: Joi.string().optional().messages({
        'string.base': 'Address must be a string',
      }),
      phoneNumber: Joi.string().optional().messages({
        'string.base': 'Phone number must be a string',
      }),
      city: Joi.string().optional().messages({
        'string.base': 'City must be a string',
      }),
      state: Joi.string().optional().messages({
        'string.base': 'State must be a string',
      }),
      country: Joi.string().optional().messages({
        'string.base': 'Country must be a string',
      }),
      bio: Joi.string().optional().messages({
        'string.base': 'Bio must be a string',
      }),
      coverageArea: Joi.array().items(Joi.string()).optional().messages({
        'string.base': 'Each coverage area must be a string',
      }),
      renderedServices: Joi.array().items(
        Joi.object({
          name: Joi.string().required().messages({
            'string.empty': 'Service name is required',
          }),
          status: Joi.string().optional().messages({
            'string.base': 'Status must be a string',
          }),
        })
      ).optional(),
      certification: Joi.array().items(
        Joi.object({
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
          issuingOrganisation: Joi.string().optional().messages({
            'string.base': 'Issuing organisation must be a string',
          }),
          coverage: Joi.string().optional().messages({
            'string.base': 'Coverage must be a string',
          }),
          description: Joi.string().optional().messages({
            'date.base': 'Description must be a valid string',
          }),
        })
      ).optional(),
    });
  
    const { error } = businessValidation.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({ errors: errorMessages });
    }
  
    next();
  };

  export const validateBusinessUpdate = (req: Request, res: Response, next: NextFunction) => {
    const businessValidation = Joi.object({
      firstName: Joi.string().optional().messages({
        'string.empty': 'First name cannot be empty',
      }),
      lastName: Joi.string().optional().messages({
        'string.empty': 'Last name cannot be empty',
      }),
      services: Joi.array().items(Joi.string()).optional().messages({
        'string.base': 'Each service must be a string',
      }),
      languages: Joi.array().items(Joi.string()).optional().messages({
        'string.base': 'Each language must be a string',
      }),
      address: Joi.string().optional().messages({
        'string.base': 'Address must be a string',
      }),
      phoneNumber: Joi.string().optional().messages({
        'string.base': 'Phone number must be a string',
      }),
      city: Joi.string().optional().messages({
        'string.base': 'City must be a string',
      }),
      state: Joi.string().optional().messages({
        'string.base': 'State must be a string',
      }),
      country: Joi.string().optional().messages({
        'string.base': 'Country must be a string',
      }),
      bio: Joi.string().optional().messages({
        'string.base': 'Bio must be a string',
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
    });
  
    const { error } = businessValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
    }
  
    next();
  };