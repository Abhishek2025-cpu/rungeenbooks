const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { getTransporter } = require('../utilis/mailer');
const fs = require('fs');
const path = require('path');

// OTP Generator
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Nodemailer transporter (This can be removed if getTransporter is always used)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// Temporary storage for unverified users
const unverifiedUsers = new Map(); // Using a Map to store users by email

// ✅ SIGNUP - Temporarily stores user data and sends OTP without saving to DB
exports.signup = async (req, res) => {
  try {
    const { firstname, lastname, username, country_code, phone, email, password } = req.body;

    // Check only for existing email in the database to prevent duplicate verified accounts
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: 0, message: 'Email already registered and verified.' });
    }

    // Check if email is already in the unverified queue
    if (unverifiedUsers.has(email)) {
      return res.status(400).json({ success: 0, message: 'An OTP has already been sent to this email. Please verify.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store user details temporarily
    unverifiedUsers.set(email, {
      firstname, lastname, username, country_code,
      phone, email, password: hashedPassword,
      otp, otpExpires,
      isVerified: false // Explicitly set to false
    });

    // Dynamic transporter
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"No Reply" <${transporter.options.auth.user}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}`
    });

    res.status(200).json({ success: 1, message: 'Signup successful. OTP sent to email. Please verify to complete registration.' });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ success: 0, message: 'Server error during signup', error: err.message });
  }
};

// ✅ VERIFY OTP - Saves details to database after successful OTP verification
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const unverifiedUser = unverifiedUsers.get(email);

    if (!unverifiedUser) {
      return res.status(404).json({ success: 0, message: 'No pending signup for this email or session expired. Please sign up again.' });
    }

    if (unverifiedUser.isVerified) {
      return res.status(400).json({ success: 0, message: 'User already verified and registered.' });
    }

    if (unverifiedUser.otp !== otp || unverifiedUser.otpExpires < new Date()) {
      return res.status(400).json({ success: 0, message: 'Invalid or expired OTP' });
    }

    // OTP is valid, now save the user to the database
    const newUser = new User({
      firstname: unverifiedUser.firstname,
      lastname: unverifiedUser.lastname,
      username: unverifiedUser.username,
      country_code: unverifiedUser.country_code,
      phone: unverifiedUser.phone,
      email: unverifiedUser.email,
      password: unverifiedUser.password, // This is already hashed
      isVerified: true, // Mark as verified upon saving
      otp: null, // Clear OTP fields
      otpExpires: null
    });

    await newUser.save();

    // Remove user from temporary storage
    unverifiedUsers.delete(email);

    res.status(200).json({
      success: 1,
      message: 'OTP verified successfully. Your account has been created!',
      userDetails: {
        id: newUser._id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        username: newUser.username,
        email: newUser.email,
        country_code: newUser.country_code,
        phone: newUser.phone
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
    if (!user) return res.status(404).json({ success: 0, message: 'Email not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"Support" <${transporter.options.auth.user}>`,
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



exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstname, lastname, username, country_code, phone, email } = req.body;

    // 1. Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: 0, message: "User not found" });
    }

    // 2. Check for uniqueness if username, email, or phone are being updated
    if (username) {
        // Check if the new username is already taken by ANOTHER user
        const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUsername) return res.status(400).json({ success: 0, message: 'Username already taken' });
        user.username = username;
    }
    if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) return res.status(400).json({ success: 0, message: 'Email already registered by another user' });
        user.email = email;
    }
    if (phone) {
        const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
        if (existingPhone) return res.status(400).json({ success: 0, message: 'Phone number already registered by another user' });
        user.phone = phone;
    }
    
    // 3. Update basic text fields
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (country_code) user.country_code = country_code;

    // 4. Handle Profile Image Upload
    if (req.file) {
      // If user already has a profile image, delete the old one
      if (user.profileImage) {
        // Construct the full path to the old image
        const oldImagePath = path.join(__dirname, '..', user.profileImage);
        
        // Check if the file exists and delete it
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
      }
      // Save the path of the new image (path is provided by multer)
      user.profileImage = req.file.path;
    }

    // 5. Save the updated user document
    const updatedUser = await user.save();

    // Hide password from the response
    updatedUser.password = undefined;

    res.status(200).json({
      success: 1,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ success: 0, message: 'Server error during profile update', error: err.message });
  }
};




