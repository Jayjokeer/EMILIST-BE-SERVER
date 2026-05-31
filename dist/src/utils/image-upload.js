"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBusinessImages = exports.multipleUpload = exports.singleUpload = exports.cloudinary = void 0;
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
        return {
            folder: 'uploads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
            public_id: file.originalname.split('.')[0] + Date.now(),
        };
    },
});
const singleUpload = (0, multer_1.default)({ storage }).single('image');
exports.singleUpload = singleUpload;
const multipleUpload = (0, multer_1.default)({ storage }).array('files', 10);
exports.multipleUpload = multipleUpload;
const uploadBusinessImages = (0, multer_1.default)({ storage }).fields([
    { name: 'displayImage', maxCount: 1 },
    { name: 'certificate', maxCount: 10 },
    { name: 'businessImages', maxCount: 10 },
]);
exports.uploadBusinessImages = uploadBusinessImages;
