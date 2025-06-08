const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  about: { type: String },
  language: { type: String, required: true },
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
