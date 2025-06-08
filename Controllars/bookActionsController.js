const Book = require('../Models/Book');
const Rating = require('../Models/Rating');
const Review = require('../Models/Review');
const Like = require('../Models/Like');
const User = require('../Models/User');

exports.postRating = async (req, res) => {
  const { userId, value } = req.body;
  const { bookId } = req.params;

  if (!value || value < 1 || value > 5) {
    return res.status(400).json({ message: '❌ Rating must be between 1 and 5' });
  }

  const user = await User.findById(userId);
  if (!user || !user.isVerified) {
    return res.status(403).json({ message: '❌ Only verified users can rate' });
  }

  await Rating.findOneAndUpdate(
    { user: userId, book: bookId },
    { value },
    { upsert: true, new: true }
  );

  res.json({ message: '✅ Rating submitted' });
};

exports.postReview = async (req, res) => {
  const { userId, text } = req.body;
  const { bookId } = req.params;

  const user = await User.findById(userId);
  if (!user || !user.isVerified) {
    return res.status(403).json({ message: '❌ Only verified users can review' });
  }

  await Review.create({
    user: userId,
    book: bookId,
    text
  });

  res.json({ message: '✅ Review added' });
};

exports.toggleLike = async (req, res) => {
  const { userId } = req.body;
  const { bookId } = req.params;

  const user = await User.findById(userId);
  if (!user || !user.isVerified) {
    return res.status(403).json({ message: '❌ Only verified users can like' });
  }

  const existing = await Like.findOne({ user: userId, book: bookId });

  if (existing) {
    await Like.deleteOne({ _id: existing._id });
    return res.json({ message: '❌ Like removed' });
  }

  await Like.create({ user: userId, book: bookId });
  res.json({ message: '❤️ Book liked' });
};

exports.getBooksByCategory = async (req, res) => {
  const { categoryId } = req.params;

  const books = await Book.find({ category: categoryId }).lean();

  const result = await Promise.all(books.map(async (book) => {
    const [ratings, reviews, likes] = await Promise.all([
      Rating.find({ book: book._id }),
      Review.find({ book: book._id }).populate('user', 'firstname lastname'),
      Like.find({ book: book._id })
    ]);

    const ratingValues = ratings.map(r => r.value);
    const averageRating = ratingValues.length > 0
      ? (ratingValues.reduce((a, b) => a + b) / ratingValues.length).toFixed(1)
      : null;

    return {
      ...book,
      averageRating: averageRating ? parseFloat(averageRating) : 0,
      ratingCount: ratings.length,
      reviewCount: reviews.length,
      likeCount: likes.length,
      reviews
    };
  }));

  res.json({ message: '✅ Books fetched successfully', books: result });
};
