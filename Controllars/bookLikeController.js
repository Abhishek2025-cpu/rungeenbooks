// controllers/bookLikeController.js

const BookLike = require('../Models/bookLikeModel');
const Book = require('../Models/Book');
const User = require('../Models/User');

// POST /like
exports.likeBook = async (req, res) => {
  const { bookId, userId } = req.body;

  try {
    const like = await BookLike.create({ book: bookId, user: userId });
    res.status(201).json({ success: true, like });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already liked.' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /like/:bookId/:userId
exports.unlikeBook = async (req, res) => {
  const { bookId, userId } = req.params;

  try {
    const deleted = await BookLike.findOneAndDelete({ book: bookId, user: userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Like not found' });
    res.json({ success: true, message: 'Unliked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /likes/book/:bookId
exports.getLikesByBook = async (req, res) => {
  try {
    const likes = await BookLike.find({ book: req.params.bookId }).populate('user', 'name email');
    res.json({ success: true, likes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /likes/category/:categoryId
exports.getLikesByCategory = async (req, res) => {
  try {
    const booksInCategory = await Book.find({ category: req.params.categoryId }).select('_id');
    const bookIds = booksInCategory.map(book => book._id);

    const likes = await BookLike.find({ book: { $in: bookIds } }).populate('book').populate('user', 'name email');
    res.json({ success: true, likes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
