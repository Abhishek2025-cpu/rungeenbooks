// Models/book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  about: { type: String },
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
  images: [String], // Path to uploaded images
}, { timestamps: true });

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
