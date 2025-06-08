const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  about: { type: String },
  language: { type: String, required: true }, // ✅ New field
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  images: [String], // Paths of book images
}, { timestamps: true });

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
