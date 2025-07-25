const express = require('express');
const router = express.Router();
const { updateUserProfile } = require('../Controllars/authController'); // or userController
const upload = require('../middlewares/multer'); // import multer config

router.put('/update-profile/:userId', upload, updateUserProfile);

module.exports = router;
