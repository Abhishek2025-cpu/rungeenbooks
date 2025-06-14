const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: { type: String, unique: true },
  country_code: String,
  phone: String,
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: Number,
  otpExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


