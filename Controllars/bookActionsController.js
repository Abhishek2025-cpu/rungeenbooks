const Book = require('../Models/bookModel');
const Rating = require('../Models/Ratings');
const Review = require('../Models/Review');
const Like = require('../Models/Like');
const User = require('../Models/User');
const mongoose = require('mongoose');

exports.postRatingAndReview = async (req, res) => {
  const { userId, rating, reviewDescription } = req.body;
  const { bookId } = req.params;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: '❌ Rating must be between 1 and 5' });
  }

  // Check user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: '❌ User not found' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: '❌ Only verified users can rate and review' });
  }

  // Check book
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ message: '❌ Book not found' });
  }

  // Submit rating (update or create)
  await Rating.findOneAndUpdate(
    { user: userId, book: bookId },
    { value: rating },
    { upsert: true, new: true }
  );

  // Submit review
  if (reviewDescription) {
    await Review.create({
      user: userId,
      book: bookId,
      text: reviewDescription
    });
  }

  res.json({ message: '✅ Rating and review submitted' });
};

exports.getRatingsAndReviews = async (req, res) => {
  const { bookId } = req.params;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ message: '❌ Book not found' });
  }

  // Fetch ratings and reviews
  const [ratings, reviews] = await Promise.all([
    Rating.find({ book: bookId }),
    Review.find({ book: bookId }).populate('user', 'firstname lastname')
  ]);

  const ratingValues = ratings.map(r => r.value);
  const averageRating = ratingValues.length > 0
    ? (ratingValues.reduce((a, b) => a + b) / ratingValues.length).toFixed(1)
    : null;

  res.json({
    message: '✅ Book ratings and reviews fetched',
    bookId,
    averageRating: averageRating ? parseFloat(averageRating) : 0,
    totalRatings: ratings.length,
    totalReviews: reviews.length,
    reviews
  });
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
  try {
    const { userId } = req.body;
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: '❌ Invalid userId or bookId' });
    }

    const user = await User.findById(userId);
    if (!user || !user.isVerified) {
      return res.status(403).json({ message: '❌ Only verified users can like books' });
    }

    const existing = await Like.findOne({ userId, bookId });

    if (existing) {
      await Like.deleteOne({ _id: existing._id });
      return res.json({ message: '❌ Like removed' });
    }

    await Like.create({ userId, bookId });
    res.json({ message: '❤️ Book liked' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

exports.getBooksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const books = await Book.find({ category: categoryId }).lean();

    const result = await Promise.all(books.map(async (book) => {
      const [ratings, reviews, likes] = await Promise.all([
        Rating.find({ bookId: book._id }),
        Review.find({ bookId: book._id }).populate('userId', 'firstname lastname'),
        Like.find({ bookId: book._id })
      ]);

      const ratingValues = ratings.map(r => r.value);
      const averageRating = ratingValues.length > 0
        ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
        : null;

      return {
        ...book,
        averageRating: averageRating ? parseFloat(averageRating) : 0,
        ratingCount: ratings.length,
        reviewCount: reviews.length,
        likeCount: likes.length,
        reviews,
      };
    }));

    res.json({ message: '✅ Books fetched successfully', books: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};


exports.getFavoriteBooks = async (req, res) => {
  try {
    const { userId } = req.params;

    const likedBooks = await Like.find({ userId }).select('bookId');
    const bookIds = likedBooks.map(like => like.bookId);

    const books = await Book.find({ _id: { $in: bookIds } }).lean();

    const result = await Promise.all(books.map(async (book) => {
      const [ratings, reviews, likes] = await Promise.all([
        Rating.find({ bookId: book._id }),
        Review.find({ bookId: book._id }).populate('userId', 'firstname lastname'),
        Like.find({ bookId: book._id }),
      ]);

      const ratingValues = ratings.map(r => r.value);
      const averageRating = ratingValues.length > 0
        ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
        : null;

      return {
        ...book,
        averageRating: averageRating ? parseFloat(averageRating) : 0,
        ratingCount: ratings.length,
        reviewCount: reviews.length,
        likeCount: likes.length,
        reviews,
      };
    }));

    // Sort by likeCount descending
    result.sort((a, b) => b.likeCount - a.likeCount);

    res.json({ message: '✅ Favorite books fetched successfully', favoriteBooks: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};



// {
//   "message": "✅ Books fetched successfully",
//   "books": [
//     {
//       "_id": "684579c67a52c6b0e1ed6324",
//       "name": "The Jungle Book",
//       "category": "684567c1298c26f3da04cb9a",
//       "author": "Rungeen Singh",
//       "language": "English",
//       "images": [
//         "https://res.cloudinary.com/demo/image/upload/v12345678/sample1.jpg",
//         "https://res.cloudinary.com/demo/image/upload/v12345678/sample2.jpg"
//       ],
//       "averageRating": 4.3,
//       "ratingCount": 50,
//       "reviewCount": 36,
//       "likeCount": 120,
//       "reviews": [
//         {
//           "_id": "684580c67a52c6b0e1ed1234",
//           "text": "A classic! Timeless storytelling.",
//           "user": {
//             "_id": "684562a1298c26f3da04aaaa",
//             "firstname": "Amit",
//             "lastname": "Verma"
//           },
//           "createdAt": "2025-06-08T12:34:56.789Z"
//         },
//         {
//           "_id": "684580c67a52c6b0e1ed5678",
//           "text": "Great for kids and nostalgic for adults.",
//           "user": {
//             "_id": "684562a1298c26f3da04bbbb",
//             "firstname": "Neha",
//             "lastname": "Sharma"
//           },
//           "createdAt": "2025-06-08T13:02:12.456Z"
//         }
//       ],
//       "createdAt": "2025-06-08T11:53:42.376Z",
//       "updatedAt": "2025-06-08T11:53:42.376Z"
//     },
//     {
//       "_id": "68457ac67a52c6b0e1ed6325",
//       "name": "Harry Potter",
//       "category": "684567c1298c26f3da04cb9a",
//       "author": "J.K. Rowling",
//       "language": "English",
//       "images": [
//         "https://res.cloudinary.com/demo/image/upload/v12345678/harry1.jpg"
//       ],
//       "averageRating": 4.8,
//       "ratingCount": 95,
//       "reviewCount": 80,
//       "likeCount": 300,
//       "reviews": [],
//       "createdAt": "2025-06-08T12:04:38.735Z",
//       "updatedAt": "2025-06-08T12:04:38.735Z"
//     }
//   ]
// }
