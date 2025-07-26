// middlewares/uploadProfile.js

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utilis/cloudinary'); // ensure correct spelling

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user_profiles',
  },
});

const upload = multer({ storage });

// ✅ THIS MUST BE A FUNCTION WITH .single() METHOD
module.exports = upload;
