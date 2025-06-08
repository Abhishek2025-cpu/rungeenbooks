const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Make sure the upload path exists
const uploadPath = path.join(__dirname, '..', 'uploads', 'bookImages');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

module.exports = multer({ storage });
