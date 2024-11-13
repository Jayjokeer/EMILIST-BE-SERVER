import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
      public_id: file.originalname.split('.')[0] + Date.now(), 
    };
  },
});

const singleUpload = multer({ storage }).single('image');

const multipleUpload = multer({ storage }).array('files', 10);

const uploadBusinessImages = multer({ storage }).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'certificate', maxCount: 10 },
  { name: 'businessImages', maxCount: 10 },
]);


export { cloudinary, singleUpload, multipleUpload,  uploadBusinessImages };