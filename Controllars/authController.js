const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // from .env
    pass: process.env.EMAIL_PASS
  }
});

exports.signup = async (req, res) => {
  try {
    const {
      firstname, lastname, username, country_code,
      phone, email, password
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: 0, message: 'Email already registered' });

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
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};



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
      data: {
        success: 1,
        message: 'OTP verified successfully',
        token: null, // no bearer token
        userDetails: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          email: user.email,
          country_code: user.country_code,
          phone: user.phone
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};
