"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMarkBusinessReview = exports.validateBusinessUpdate = exports.validateBusinessRegistration = void 0;
const joi_1 = __importDefault(require("joi"));
const validateBusinessRegistration = (req, res, next) => {
    const businessValidation = joi_1.default.object({
        firstName: joi_1.default.string().required().messages({
            'string.empty': 'First name is required',
        }),
        lastName: joi_1.default.string().required().messages({
            'string.empty': 'Last name is required',
        }),
        services: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each service must be a string',
        }),
        languages: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each language must be a string',
        }),
        address: joi_1.default.string().optional().messages({
            'string.base': 'Address must be a string',
        }),
        currency: joi_1.default.string().optional().messages({
            'string.base': 'Currency must be a string',
        }),
        phoneNumber: joi_1.default.string().optional().messages({
            'string.base': 'Phone number must be a string',
        }),
        city: joi_1.default.string().optional().messages({
            'string.base': 'City must be a string',
        }),
        state: joi_1.default.string().optional().messages({
            'string.base': 'State must be a string',
        }),
        country: joi_1.default.string().optional().messages({
            'string.base': 'Country must be a string',
        }),
        bio: joi_1.default.string().optional().messages({
            'string.base': 'Bio must be a string',
        }),
        coverageArea: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each coverage area must be a string',
        }),
        renderedServices: joi_1.default.array().items(joi_1.default.object({
            name: joi_1.default.string().optional().messages({
                'string.base': 'Service name must be a string',
            }),
            status: joi_1.default.string().optional().messages({
                'string.base': 'Status must be a string',
            }),
        })).optional(),
        certification: joi_1.default.array().items(joi_1.default.object({
            issuingOrganisation: joi_1.default.string().optional().messages({
                'string.base': 'Issuing organisation must be a string',
            }),
            verificationNumber: joi_1.default.string().optional().messages({
                'string.base': 'Verification number must be a string',
            }),
            issuingDate: joi_1.default.date().optional().messages({
                'date.base': 'Issuing date must be a valid date',
            }),
            expiringDate: joi_1.default.date().optional().messages({
                'date.base': 'Expiring date must be a valid date',
            }),
            isCertificateExpire: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Certificate expiry must be a boolean',
            }),
        })).optional(),
        membership: joi_1.default.array().items(joi_1.default.object({
            organisation: joi_1.default.string().optional().messages({
                'string.base': 'Organisation must be a string',
            }),
            positionHeld: joi_1.default.string().optional().messages({
                'string.base': 'Position held must be a string',
            }),
            startDate: joi_1.default.date().optional().messages({
                'date.base': 'Start date must be a valid date',
            }),
            endDate: joi_1.default.date().optional().messages({
                'date.base': 'End date must be a valid date',
            }),
            isMembershipExpire: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Membership expiry must be a boolean',
            }),
        })).optional(),
        insurance: joi_1.default.array().items(joi_1.default.object({
            issuingOrganisation: joi_1.default.string().optional().messages({
                'string.base': 'Issuing organisation must be a string',
            }),
            coverage: joi_1.default.string().optional().messages({
                'string.base': 'Coverage must be a string',
            }),
            description: joi_1.default.string().optional().messages({
                'date.base': 'Description must be a valid string',
            }),
        })).optional(),
        businessName: joi_1.default.string().required().messages({
            'string.base': 'Business name must be a string',
            'string.empty': 'Business name is required',
        }),
        yearFounded: joi_1.default.string().required().messages({
            'string.base': 'Year founded must be a string',
            'string.empty': 'Year founded is required',
        }),
        numberOfEmployee: joi_1.default.number().required().messages({
            'number.base': 'number of employees must be a number',
            'number.empty': 'number of employees is required',
        }),
        businessAddress: joi_1.default.string().optional().messages({
            'string.base': 'Business address must be a string',
        }),
        businessCity: joi_1.default.string().optional().messages({
            'string.base': 'City must be a string',
        }),
        businessState: joi_1.default.string().required().messages({
            'string.base': 'State must be a string',
            'string.empty': 'State is required',
        }),
        businessCountry: joi_1.default.string().required().messages({
            'string.base': 'Country must be a string',
            'string.empty': 'Country is required',
        }),
        startingPrice: joi_1.default.number().required().messages({
            'number.base': 'Starting price must be a number',
            'number.empty': 'Starting Price is required',
        }),
        noticePeriod: joi_1.default.string().required().messages({
            'string.base': 'Notice period must be a string',
            'string.empty': 'Notice period is required',
        }),
        businessDescription: joi_1.default.string().required().messages({
            'string.base': 'Description must be a string',
            'string.empty': 'Description is required',
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
exports.validateBusinessRegistration = validateBusinessRegistration;
const validateBusinessUpdate = (req, res, next) => {
    const businessValidation = joi_1.default.object({
        firstName: joi_1.default.string().optional().messages({
            'string.empty': 'First name cannot be empty',
        }),
        lastName: joi_1.default.string().optional().messages({
            'string.empty': 'Last name cannot be empty',
        }),
        services: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each service must be a string',
        }),
        languages: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each language must be a string',
        }),
        address: joi_1.default.string().optional().messages({
            'string.base': 'Address must be a string',
        }),
        phoneNumber: joi_1.default.string().optional().messages({
            'string.base': 'Phone number must be a string',
        }),
        city: joi_1.default.string().optional().messages({
            'string.base': 'City must be a string',
        }),
        state: joi_1.default.string().optional().messages({
            'string.base': 'State must be a string',
        }),
        country: joi_1.default.string().optional().messages({
            'string.base': 'Country must be a string',
        }),
        bio: joi_1.default.string().optional().messages({
            'string.base': 'Bio must be a string',
        }),
        coverageArea: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            'string.base': 'Each coverage area must be a string',
        }),
        renderedServices: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().optional().messages({
                'string.base': 'Rendered Service ID must be a string',
            }),
            name: joi_1.default.string().optional().messages({
                'string.empty': 'Service name cannot be empty',
            }),
            status: joi_1.default.string().optional().messages({
                'string.base': 'Status must be a string',
            }),
        })).optional(),
        certification: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().optional().messages({
                'string.base': 'Certification ID must be a string',
            }),
            issuingOrganisation: joi_1.default.string().optional().messages({
                'string.base': 'Issuing organisation must be a string',
            }),
            verificationNumber: joi_1.default.string().optional().messages({
                'string.base': 'Verification number must be a string',
            }),
            issuingDate: joi_1.default.date().optional().messages({
                'date.base': 'Issuing date must be a valid date',
            }),
            expiringDate: joi_1.default.date().optional().messages({
                'date.base': 'Expiring date must be a valid date',
            }),
            isCertificateExpire: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Certificate expiry must be a boolean',
            }),
        })).optional(),
        membership: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().optional().messages({
                'string.base': 'Membership ID must be a string',
            }),
            organisation: joi_1.default.string().optional().messages({
                'string.base': 'Organisation must be a string',
            }),
            positionHeld: joi_1.default.string().optional().messages({
                'string.base': 'Position held must be a string',
            }),
            startDate: joi_1.default.date().optional().messages({
                'date.base': 'Start date must be a valid date',
            }),
            endDate: joi_1.default.date().optional().messages({
                'date.base': 'End date must be a valid date',
            }),
            isMembershipExpire: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Membership expiry must be a boolean',
            }),
        })).optional(),
        insurance: joi_1.default.array().items(joi_1.default.object({
            id: joi_1.default.string().optional().messages({
                'string.base': 'Insurance ID must be a string',
            }),
            issuingOrganisation: joi_1.default.string().optional().messages({
                'string.base': 'Issuing organisation must be a string',
            }),
            coverage: joi_1.default.string().optional().messages({
                'string.base': 'Coverage must be a string',
            }),
            description: joi_1.default.string().optional().messages({
                'string.base': 'Description must be a string',
            }),
        })).optional(),
        businessName: joi_1.default.string().optional().messages({
            'string.base': 'Business name must be a string',
        }),
        yearFounded: joi_1.default.string().optional().messages({
            'string.base': 'Year founded must be a string',
        }),
        numberOfEmployee: joi_1.default.number().optional().messages({
            'number.base': 'number of employees must be a number',
        }),
        businessAddress: joi_1.default.string().optional().messages({
            'string.base': 'Business address must be a string',
        }),
        businessCity: joi_1.default.string().optional().messages({
            'string.base': 'City must be a string',
        }),
        businessState: joi_1.default.string().optional().messages({
            'string.base': 'State must be a string',
        }),
        businessCountry: joi_1.default.string().optional().messages({
            'string.base': 'Country must be a string',
        }),
        startingPrice: joi_1.default.number().optional().messages({
            'number.base': 'Starting price must be a number',
        }),
        noticePeriod: joi_1.default.string().optional().messages({
            'string.base': 'Notice period must be a string',
        }),
        businessDescription: joi_1.default.string().optional().messages({
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
exports.validateBusinessUpdate = validateBusinessUpdate;
const validateMarkBusinessReview = (req, res, next) => {
    const businessReviewValidation = joi_1.default.object({
        isHelpful: joi_1.default.boolean().messages({
            'boolean.empty': 'isHelpful cannot be empty',
            'boolean.base': 'isHelpful must be boolean'
        }),
        userId: joi_1.default.string().optional().messages({
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
exports.validateMarkBusinessReview = validateMarkBusinessReview;
