const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  about: { type: String, required: true }, // ✅ Ensure it's a string not array
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  coverImage: { type: String },
  images: {
    otherImages: [String]
  },
  subscribeId: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
