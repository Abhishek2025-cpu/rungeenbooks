const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
 filename: (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + file.originalname;
  console.log("Writing file to:", path.join(uploadDir, uniqueSuffix));
  cb(null, uniqueSuffix);
}

});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).fields([
  { name: "coverImage", maxCount: 1 },
  { name: "otherImages", maxCount: 5 },
  { name: "pdf", maxCount: 1 },
]);

module.exports = upload;
