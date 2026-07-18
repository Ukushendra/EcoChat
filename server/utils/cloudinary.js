const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure local disk storage for temporary files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Images only (jpg, jpeg, png, webp)!'));
  },
});

// Configure Cloudinary
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.log('Cloudinary not configured. Defaulting to local uploads storage fallback.');
}

const uploadImage = async (filePath) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'ecochat_avatars',
        transformation: [{ width: 250, height: 250, crop: 'limit' }],
      });
      // Delete local temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err.message);
      }
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, using local fallback:', error.message);
      const filename = path.basename(filePath);
      return `/uploads/${filename}`;
    }
  } else {
    // If not configured, keep file in public/uploads and return server path
    const filename = path.basename(filePath);
    return `/uploads/${filename}`;
  }
};

module.exports = { upload, uploadImage };
