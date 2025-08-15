// controllers/bookLikeController.js

const BookLike = require('../Models/bookLikeModel');
const Book = require('../Models/Book');
const User = require('../Models/User');
const Author = require('../Models/authorInfoModel');

// PATCH /like
exports.toggleLikeBook = async (req, res) => {
  const { bookId, userId } = req.body;

  try {
    const existingLike = await BookLike.findOne({ book: bookId, user: userId });

    if (existingLike) {
      await existingLike.deleteOne();
      return res.json({ success: true, message: 'Unliked successfully', liked: false });
    } else {
      const like = await BookLike.create({ book: bookId, user: userId });
      return res.status(201).json({ success: true, message: 'Liked successfully', liked: true, like });
    }
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


// GET /likes/user/:userId
// controllers/bookLikeController.js


exports.getLikesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const likes = await BookLike.find({ user: userId })
      .populate({
        path: 'book',
        select: 'name coverImage price author',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .populate('user', 'name email');

    // Flatten author name directly into the book object
    const transformedLikes = likes.map(like => {
      const book = like.book?.toObject?.() || {};
      return {
        ...like.toObject(),
        book: {
          ...book,
          authorName: book.author?.name || null
        }
      };
    });

    res.json({
      success: true,
      count: transformedLikes.length,
      likes: transformedLikes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


