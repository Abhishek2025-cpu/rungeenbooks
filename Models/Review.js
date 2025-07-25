const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  description: {
    type: String,
    maxlength: 300,
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);