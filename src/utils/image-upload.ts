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
      folder: 'images',
      // allowed_formats: ['jpg', 'png', 'jpeg'], // Adjust allowed formats as needed
      public_id: file.originalname.split('.')[0] + Date.now(), // Ensure unique public_id
      // transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional
    };
  },
});

const singleUpload = multer({ storage }).single('image');

const multipleUpload = multer({ storage }).array('files', 10);

export { cloudinary, singleUpload, multipleUpload };