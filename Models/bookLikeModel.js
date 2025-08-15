// models/bookLikeModel.js

const mongoose = require('mongoose');

const bookLikeSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate likes by same user on same book
bookLikeSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('BookLike', bookLikeSchema);
