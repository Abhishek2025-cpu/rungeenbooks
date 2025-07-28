const mongoose = require('mongoose');

const authorInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  info: {
    type: String,
    required: true,
  },
  profile: {
    type: String, // Cloudinary image URL
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('AuthorInfo', authorInfoSchema);