const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// OTP Generator
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ SIGNUP
exports.signup = async (req, res) => {
  try {
    const {
      firstname, lastname, username, country_code,
      phone, email, password
    } = req.body;

    // Check for existing email, username or phone
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: 0, message: 'Email already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ success: 0, message: 'Username already taken' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ success: 0, message: 'Phone number already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newUser = new User({
      firstname, lastname, username, country_code,
      phone, email, password: hashedPassword,
      otp, otpExpires
    });

    await newUser.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}`
    });

    res.status(200).json({ success: 1, message: 'Signup successful. OTP sent to email.' });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ success: 0, message: 'Server error during signup', error: err.message });
  }
};

// ✅ VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: 0, message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ success: 0, message: 'User already verified' });

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ success: 0, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      success: 1,
      message: 'OTP verified successfully',
      userDetails: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        country_code: user.country_code,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ success: 0, message: 'Server error during OTP verification', error: err.message });
  }
};

// ✅ LOGIN WITH EMAIL & PASSWORD
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: 0, message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: 0, message: 'No account found with this email' });

    if (!user.isVerified)
      return res.status(403).json({ success: 0, message: 'Account not verified. Please verify OTP first.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: 0, message: 'Incorrect password' });

    res.status(200).json({
      success: 1,
      message: 'Login successful',
      userDetails: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        country_code: user.country_code,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: 0, message: 'Server error during login', error: err.message });
  }
};


// === FORGOT PASSWORD ===
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: 0, message: 'Email not found' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password OTP',
      text: `Your password reset OTP is ${otp}`
    });

    res.status(200).json({ success: 1, message: 'OTP sent to email for password reset' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ success: 0, message: 'Server error during forgot password', error: err.message });
  }
};

// === RESET PASSWORD ===
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: 0, message: 'User not found' });

    // ✅ Check OTP & Expiry
    if (!user.otp || !user.otpExpires || String(user.otp) !== String(otp)) {
      return res.status(400).json({ success: 0, message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ success: 0, message: 'OTP expired' });
    }

    // ✅ Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // ✅ Clear OTP fields
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.status(200).json({ success: 1, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};
