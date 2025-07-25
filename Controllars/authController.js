const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fs = require('fs'); 
const path = require('path');

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



// Import necessary modules
// const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');
// const mongoose = require('mongoose');
// const express = require('express');
// const redis = require('redis');
// const { v4: uuidv4 } = require('uuid'); // For generating unique session IDs

// const app = express();
// app.use(express.json());

// // Load environment variables (if using .env file)
// require('dotenv').config();

// // Configure Redis
// const redisClient = redis.createClient({
//     url: process.env.REDIS_URL || 'redis://default:redispw@localhost:6379' // Use environment variable or default
// });

// redisClient.on('error', err => console.log('Redis Client Error', err));

// (async () => {
//     try {
//         await redisClient.connect();
//         console.log('Connected to Redis');
//     } catch (error) {
//         console.error('Failed to connect to Redis:', error);
//     }
// })();

// // Configure Nodemailer (replace with your email service details)
// const transporter = nodemailer.createTransport({
//     service: 'gmail', // Or your email service
//     auth: {
//         user: process.env.EMAIL_USER, // Your email address
//         pass: process.env.EMAIL_PASS  // Your email password or app password
//     }
// });

// // Connect to MongoDB (replace with your MongoDB connection string)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log('Connected to MongoDB'))
//     .catch(err => console.error('MongoDB connection error:', err));

// // Define User Schema and Model
// const userSchema = new mongoose.Schema({
//     firstname: { type: String, required: true },
//     lastname: { type: String, required: true },
//     username: { type: String, required: true, unique: true },
//     country_code: { type: String, required: true },
//     phone: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     isVerified: { type: Boolean, default: false },
//     otp: { type: String },
//     otpExpires: { type: Date }
// });

// const User = mongoose.model('User', userSchema);

// // Helper function to generate OTP
// function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // Signup Endpoint
// exports.signup = async (req, res) => {
//     try {
//         const {
//             firstname, lastname, username, country_code,
//             phone, email, password
//         } = req.body;

//         // Check for existing email, username or phone
//         const existingEmail = await User.findOne({ email });
//         if (existingEmail) return res.status(400).json({ success: 0, message: 'Email already registered' });

//         const existingUsername = await User.findOne({ username });
//         if (existingUsername) return res.status(400).json({ success: 0, message: 'Username already taken' });

//         const existingPhone = await User.findOne({ phone });
//         if (existingPhone) return res.status(400).json({ success: 0, message: 'Phone number already registered' });

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const otp = generateOTP();
//         const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

//         const userData = {
//             firstname, lastname, username, country_code,
//             phone, email, password: hashedPassword,
//             otp, otpExpires,
//             isVerified: false
//         };

//         // Store in Redis with an expiration time (e.g., 10 minutes = 600 seconds)
//         await redisClient.setEx(`tempuser:${email}`, 600, JSON.stringify(userData));

//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Your OTP Code',
//             text: `Your OTP is ${otp}`
//         });

//         res.status(200).json({ success: 1, message: 'Signup successful. OTP sent to email.  Please verify OTP to complete registration.' });
//     } catch (err) {
//         console.error('Signup Error:', err);
//         res.status(500).json({ success: 0, message: 'Server error during signup', error: err.message });
//     }
// };

// // Verify OTP Endpoint
// exports.verifyOTP = async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         const userDataString = await redisClient.get(`tempuser:${email}`);
//         if (!userDataString) {
//             return res.status(404).json({ success: 0, message: 'User not found or OTP expired.' });
//         }

//         const userData = JSON.parse(userDataString);

//         if (userData.isVerified) {
//             return res.status(400).json({ success: 0, message: 'User already verified' });
//         }

//         if (userData.otp !== otp || new Date(userData.otpExpires) < new Date()) {
//             return res.status(400).json({ success: 0, message: 'Invalid or expired OTP' });
//         }

//         // OTP is valid, create the user in the database
//         const newUser = new User({
//             firstname: userData.firstname,
//             lastname: userData.lastname,
//             username: userData.username,
//             country_code: userData.country_code,
//             phone: userData.phone,
//             email: userData.email,
//             password: userData.password, // hashedPassword
//             isVerified: true,
//             otp: null,
//             otpExpires: null
//         });

//         await newUser.save();

//         // Remove from Redis
//         await redisClient.del(`tempuser:${email}`);

//         res.status(200).json({
//             success: 1,
//             message: 'OTP verified successfully',
//             userDetails: {
//                 id: newUser._id,
//                 firstname: newUser.firstname,
//                 lastname: newUser.lastname,
//                 username: newUser.username,
//                 email: newUser.email,
//                 country_code: newUser.country_code,
//                 phone: newUser.phone
//             }
//         });
//     } catch (err) {
//         console.error('OTP Verification Error:', err);
//         res.status(500).json({ success: 0, message: 'Server error during OTP verification', error: err.message });
//     }
// };

// // Login Endpoint (Example - Adapt as needed)
// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ success: 0, message: 'Invalid credentials' });
//         }

//         const passwordMatch = await bcrypt.compare(password, user.password);
//         if (!passwordMatch) {
//             return res.status(404).json({ success: 0, message: 'Invalid credentials' });
//         }

//         if (!user.isVerified) {
//             return res.status(400).json({ success: 0, message: 'Please verify your email first' });
//         }

//         // Generate a unique session ID
//         const sessionId = uuidv4();

//         // Store user information in Redis with the session ID as the key
//         const sessionData = {
//             userId: user._id.toString(), // Store user ID as string
//             email: user.email,
//             username: user.username
//         };

//         // Set session data in Redis with expiration (e.g., 1 hour)
//         await redisClient.setEx(`session:${sessionId}`, 3600, JSON.stringify(sessionData));

//         // Send the session ID back to the client
//         res.status(200).json({
//             success: 1,
//             message: 'Login successful',
//             sessionId: sessionId, // Send the session ID
//             userDetails: {
//                 id: user._id,
//                 firstname: user.firstname,
//                 lastname: user.lastname,
//                 username: user.username,
//                 email: user.email,
//                 country_code: user.country_code,
//                 phone: user.phone
//             }
//         });

//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ success: 0, message: 'Login failed', error: error.message });
//     }
// };

// // Middleware to check if user is authenticated (example)
// exports.isAuthenticated = async (req, res, next) => {
//     const sessionId = req.headers['x-session-id']; // Or however you pass the session ID

//     if (!sessionId) {
//         return res.status(401).json({ success: 0, message: 'Unauthorized: No session ID provided' });
//     }

//     const sessionDataString = await redisClient.get(`session:${sessionId}`);

//     if (!sessionDataString) {
//         return res.status(401).json({ success: 0, message: 'Unauthorized: Invalid or expired session' });
//     }

//     const sessionData = JSON.parse(sessionDataString);
//     req.user = sessionData; // Attach user data to the request object
//     next();
// };

// // Example protected route
// exports.protectedRoute = async (req, res) => {
//     // The isAuthenticated middleware will run before this
//     res.status(200).json({
//         success: 1,
//         message: 'This is a protected route',
//         user: req.user // Access user data from req.user
//     });
// };

// // Logout Endpoint (Example)
// exports.logout = async (req, res) => {
//     const sessionId = req.headers['x-session-id'];

//     if (!sessionId) {
//         return res.status(400).json({ success: 0, message: 'No session ID provided' });
//     }

//     try {
//         await redisClient.del(`session:${sessionId}`);
//         res.status(200).json({ success: 1, message: 'Logged out successfully' });
//     } catch (error) {
//         console.error('Logout error:', error);
//         res.status(500).json({ success: 0, message: 'Failed to logout', error: error.message });
//     }
// };

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// // Define routes (example)
// app.post('/signup', exports.signup);
// app.post('/verify-otp', exports.verifyOTP);
// app.post('/login', exports.login);
// app.get('/protected', exports.isAuthenticated, exports.protectedRoute); // Example protected route
// app.post('/logout', exports.logout);
