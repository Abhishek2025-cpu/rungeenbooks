const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utilis/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user_profiles',
    // ✅ removed allowed_formats
  },
});

const upload = multer({ storage });
module.exports = upload;
