const express = require('express');
const router = express.Router();
const {
  signup,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword
} = require('../Controllars/authController');

// Signup and OTP verification
router.post('/signup', signup);
router.post('/otp_verification', verifyOTP);

// Login
router.post('/login', login);

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Reset Password
router.post('/reset-password', resetPassword);

module.exports = router;
