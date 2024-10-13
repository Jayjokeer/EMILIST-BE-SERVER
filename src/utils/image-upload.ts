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
        console.log(file)
      return {
        folder: 'images', 
        allowed_format: ['jpg', 'png', 'jpeg'], 
        public_id: file.originalname.split('.')[0], 
        transformation: [{ width: 500, height: 500, crop: 'limit' }], 
      };
    },
  });
  
const upload = multer({ storage });

export { cloudinary, upload };
