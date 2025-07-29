// controllers/trendingBookController.js
const TrendingBook = require('../Models/trendingBookModel');
const Book = require('../Models/Book');
const AuthorInfo = require('../Models/authorInfoModel');
const Review = require('../Models/Review');




// Add book to trending
exports.addTrendingBook = async (req, res) => {
  try {
    const { bookId, position } = req.body;

    const bookExists = await Book.findById(bookId);
    if (!bookExists) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const trending = new TrendingBook({ book: bookId, position });
    await trending.save();

    res.status(201).json({ success: true, message: 'Book added to trending', trending });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update trending book position
exports.updateTrendingBook = async (req, res) => {
  try {
    const { id } = req.params; // trending book _id
    const { position } = req.body;

    const updated = await TrendingBook.findByIdAndUpdate(id, { position }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Trending book not found' });
    }

    res.json({ success: true, message: 'Trending book updated', trending: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Remove from trending
exports.removeTrendingBook = async (req, res) => {
  try {
    const { id } = req.params;

    const removed = await TrendingBook.findByIdAndDelete(id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Trending book not found' });
    }

    res.json({ success: true, message: 'Trending book removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all trending books
exports.getTrendingBooks = async (req, res) => {
  try {
    const trendingBooks = await TrendingBook.find()
      .populate({
        path: 'book',
        populate: {
          path: 'authorId',
          model: 'AuthorInfo'
        }
      })
      .sort({ position: 1 })
      .lean();

    const booksWithDetails = await Promise.all(
      trendingBooks.map(async trending => {
        const book = trending.book;
        const reviews = await Review.find({ book: book._id })
          .populate('user', 'firstName lastName profileImage')
          .lean();

        const transformedReviews = reviews.map(r => ({
          ...r,
          reviewer: r.user,
        }));

        const { authorId, ...restBook } = book;

        return {
          _id: trending._id,
          position: trending.position,
          addedAt: trending.addedAt,
          book: {
            ...restBook,
            authorDetails: authorId,
            reviews: transformedReviews
          }
        };
      })
    );

    res.json({ success: true, books: booksWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
