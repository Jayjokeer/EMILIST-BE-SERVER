"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBusinessImages = exports.multipleUpload = exports.singleUpload = exports.cloudinary = exports.parseJobBody = exports.parseBusinessOnboarding = exports.normalizeBusinessFileField = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        let folder = 'uploads';
        let publicId = file.originalname.split('.')[0] + Date.now();
        if (file.fieldname.startsWith('certificate_')) {
            const index = file.fieldname.split('_')[1];
            folder = 'uploads/certificates';
            publicId = `cert_${index}_${Date.now()}`;
        }
        return {
            folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
            public_id: publicId,
        };
    },
});
const singleUpload = (0, multer_1.default)({ storage }).single('image');
exports.singleUpload = singleUpload;
const multipleUpload = (0, multer_1.default)({ storage }).array('files', 10);
exports.multipleUpload = multipleUpload;
const normalizeBusinessFileField = (fieldName) => {
    const trimmedFieldName = fieldName.trim();
    if (trimmedFieldName === 'displayImage' || trimmedFieldName === 'businessImages') {
        return trimmedFieldName;
    }
    // Accept certificate_0 (documented), certificate_[0], and certificate[0].
    const certificateMatch = trimmedFieldName.match(/^certificate_?(?:\[(\d+)\]|(\d+))$/);
    if (!certificateMatch)
        return undefined;
    const index = Number(certificateMatch[1] ?? certificateMatch[2]);
    if (!Number.isInteger(index) || index < 0 || index >= 20)
        return undefined;
    return `certificate_${index}`;
};
exports.normalizeBusinessFileField = normalizeBusinessFileField;
const businessFileUpload = (0, multer_1.default)({
    storage,
    limits: { files: 31 },
    fileFilter: (req, file, callback) => {
        const normalizedFieldName = (0, exports.normalizeBusinessFileField)(file.fieldname);
        if (!normalizedFieldName) {
            return callback(new multer_1.default.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        const uploadCounts = (req.businessUploadCounts ??= {});
        const maxCount = normalizedFieldName === 'businessImages' ? 10 : 1;
        uploadCounts[normalizedFieldName] = (uploadCounts[normalizedFieldName] ?? 0) + 1;
        if (uploadCounts[normalizedFieldName] > maxCount) {
            return callback(new multer_1.default.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        // Normalize before storage so certificate files use the certificate folder
        // and downstream services can consistently read certificate_<index>.
        file.fieldname = normalizedFieldName;
        callback(null, true);
    },
}).any();
const uploadBusinessImages = (req, res, next) => {
    businessFileUpload(req, res, (error) => {
        delete req.businessUploadCounts;
        if (error)
            return next(error);
        const groupedFiles = {};
        for (const file of req.files ?? []) {
            (groupedFiles[file.fieldname] ??= []).push(file);
        }
        req.files = groupedFiles;
        next();
    });
};
exports.uploadBusinessImages = uploadBusinessImages;
const parseBusinessOnboarding = (req, res, next) => {
    try {
        if (req.body.profile) {
            req.body.profile = JSON.parse(req.body.profile);
        }
        if (req.body.business) {
            req.body.business = JSON.parse(req.body.business);
            // Browsers often serialize empty optional date inputs as empty strings.
            // Remove them so Joi/Mongoose treat them as omitted optional values.
            for (const certification of req.body.business.certifications ?? []) {
                if (certification.issuingDate === '')
                    delete certification.issuingDate;
                if (certification.expiringDate === '')
                    delete certification.expiringDate;
            }
            for (const membership of req.body.business.memberships ?? []) {
                if (membership.startDate === '')
                    delete membership.startDate;
                if (membership.endDate === '')
                    delete membership.endDate;
            }
        }
        next();
    }
    catch (err) {
        return res.status(400).json({
            message: "Invalid JSON in profile or business field",
        });
    }
};
exports.parseBusinessOnboarding = parseBusinessOnboarding;
/**
 * Parses JSON-stringified fields sent via multipart/form-data for the JOB endpoints.
 *
 * curl / HTML forms / Swagger UI send every multipart field as a string, so nested
 * objects and arrays (e.g. `location`, `jobDuration`, `totalBudget`, `milestones`)
 * arrive as JSON strings. This middleware:
 *   - parses those JSON strings back into real objects/arrays, and
 *   - removes empty-string fields so optional / urgency-forbidden fields don't
 *     trigger validation errors.
 */
const parseJobBody = (req, res, next) => {
    try {
        // 1. Remove all empty-string fields (form builders often send blank fields)
        for (const key of Object.keys(req.body)) {
            if (req.body[key] === "") {
                delete req.body[key];
            }
        }
        // 2. Parse JSON-stringified object/array values into real ones
        const jsonFields = [
            "location",
            "jobDuration",
            "totalBudget",
            "estimatedBudget",
            "recurringBudget",
            "jobSchedule",
            "duration",
            "milestones",
            "reminderDates",
            "jobFiles",
            "images",
        ];
        for (const key of jsonFields) {
            if (req.body[key] === undefined)
                continue;
            if (typeof req.body[key] === "string") {
                try {
                    req.body[key] = JSON.parse(req.body[key]);
                }
                catch {
                    // Leave as-is; the Joi validation will report a clear error
                }
            }
        }
        next();
    }
    catch (err) {
        return res.status(400).json({
            message: "Invalid JSON in one of the job fields",
        });
    }
};
exports.parseJobBody = parseJobBody;
