const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  bookName: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  about: {
    type: String,
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available',
  },
  images: [
    {
      filename: String,
      path: String,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
