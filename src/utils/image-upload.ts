import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
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
const singleUpload = multer({ storage }).single('image');

const multipleUpload = multer({ storage }).array('files', 10);

const uploadBusinessImages = multer({ storage }).fields([
  { name: 'displayImage', maxCount: 1 },
  { name: 'businessImages', maxCount: 10 },
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `certificate_${i}`,
    maxCount: 1,
  })),
]);

export const parseBusinessOnboarding = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.profile) {
      req.body.profile = JSON.parse(req.body.profile);
    }

    if (req.body.business) {
      req.body.business = JSON.parse(req.body.business);
    }

    next();
  } catch (err) {
    return res.status(400).json({
      message: "Invalid JSON in profile or business field",
    });
  }
};

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
export const parseJobBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      if (req.body[key] === undefined) continue;

      if (typeof req.body[key] === "string") {
        try {
          req.body[key] = JSON.parse(req.body[key]);
        } catch {
          // Leave as-is; the Joi validation will report a clear error
        }
      }
    }

    next();
  } catch (err) {
    return res.status(400).json({
      message: "Invalid JSON in one of the job fields",
    });
  }
};

export { cloudinary, singleUpload, multipleUpload, uploadBusinessImages };