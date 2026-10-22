"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = exports.extractProfileDto = exports.assertServiceFieldsPresent = exports.PROFILE_FIELDS = void 0;
exports.assertAllProfileFieldsPresent = assertAllProfileFieldsPresent;
const error_1 = require("../errors/error");
exports.PROFILE_FIELDS = [
    'firstName',
    'lastName',
    'mobile',
    'languages',
    'houseAddress',
    'city',
    'state',
    'country',
    'bio',
];
function assertAllProfileFieldsPresent(dto) {
    const missing = exports.PROFILE_FIELDS.filter((f) => !dto[f]?.toString().trim());
    if (missing.length) {
        throw new error_1.NotFoundError(`The following fields are required: ${missing.join(', ')}`);
    }
}
const SETUP_SERVICE_FIELDS = [
    'services',
    'coverageArea',
    'businessName',
    'yearFounded',
    'numberOfEmployee',
    'businessAddress',
    'businessState',
    'businessCountry',
    'startingPrice',
    'currency',
    'rateUnit',
    'noticePeriod',
    'businessDescription',
];
const assertServiceFieldsPresent = (dto) => {
    const missing = SETUP_SERVICE_FIELDS.filter((f) => {
        const val = dto[f];
        if (Array.isArray(val))
            return val.length === 0;
        if (typeof val === 'number')
            return val === undefined || val === null;
        return !val?.toString().trim();
    });
    if (missing.length) {
        throw new Error(`The following fields are required: ${missing.join(', ')}`);
    }
    if (dto.coverageArea.length > 5) {
        throw new Error('Coverage area cannot exceed 5 locations');
    }
    if (dto.businessImages && dto.businessImages.length > 5) {
        throw new Error('You can upload a maximum of 5 business images');
    }
};
exports.assertServiceFieldsPresent = assertServiceFieldsPresent;
const resolveFileUrl = (req) => req.fileUrl ??
    req.file?.location ??
    req.file?.path ??
    req.body.displayImage;
const normalizeLanguages = (value) => {
    if (value === undefined || value === null)
        return undefined;
    if (Array.isArray(value)) {
        return value
            .filter((language) => typeof language === 'string')
            .map((language) => language.trim())
            .filter(Boolean);
    }
    if (typeof value !== 'string')
        return undefined;
    const trimmedValue = value.trim();
    if (!trimmedValue)
        return [];
    // Arrays in multipart/form-data commonly arrive as JSON strings.
    try {
        const parsedValue = JSON.parse(trimmedValue);
        if (Array.isArray(parsedValue))
            return normalizeLanguages(parsedValue);
    }
    catch {
        // A plain string is a valid single language.
    }
    return [trimmedValue];
};
const extractProfileDto = (req) => {
    const body = req.body || {};
    return {
        firstName: body.firstName,
        lastName: body.lastName,
        countryCode: body.countryCode,
        mobile: body.mobile,
        // `languages` is the current API field. Keep the singular name as a
        // fallback for clients using the previous request format.
        languages: normalizeLanguages(body.languages ?? body.language),
        houseAddress: body.houseAddress,
        city: body.city,
        state: body.state,
        country: body.country,
        bio: body.bio,
        displayImage: resolveFileUrl(req),
    };
};
exports.extractProfileDto = extractProfileDto;
const getUserId = (req) => {
    return req.user?.id;
};
exports.getUserId = getUserId;
