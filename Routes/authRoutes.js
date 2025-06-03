const express = require('express');
const router = express.Router();
const { signup, verifyOTP } = require('../Controllars/authController');

router.post('/signup', signup);
router.post('/otp_verification', verifyOTP);

module.exports = router;
