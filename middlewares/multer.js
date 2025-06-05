const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create tmp folder if doesn't exist
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tmpDir); // store in /tmp folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = upload;

