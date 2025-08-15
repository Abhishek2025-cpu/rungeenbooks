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


const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coverImage: { type: String, required: true },
  price: { type: Number, required: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuthorInfo', // exact model name from authorInfoModel.js
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);


// Prevent duplicate likes by same user on same book
bookLikeSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('BookLike', bookLikeSchema);
