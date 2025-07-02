// middlewares/multer.js

const multer = require('multer');
const path = require('path');

// Configure storage (saving to disk temporarily)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure you have an 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Configure file size limits
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB limit per file
  fieldSize: 10 * 1024 * 1024, // 10 MB limit for non-file fields
};

// The main upload middleware using multer.fields
const upload = multer({
  storage: storage,
  limits: limits, // Apply the limits
  fileFilter: (req, file, cb) => {
    // You can add file type validation here if needed
    cb(null, true);
  },
}).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'otherImages', maxCount: 5 },
  { name: 'pdf', maxCount: 1 },
]);

module.exports = upload;