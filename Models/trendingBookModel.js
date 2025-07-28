// models/trendingBookModel.js
const mongoose = require('mongoose');

const trendingBookSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    unique: true, // A book should not appear twice in trending
  },
  position: {
    type: Number,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('TrendingBook', trendingBookSchema);
