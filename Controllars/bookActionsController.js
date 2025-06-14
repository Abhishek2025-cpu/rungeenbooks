const Book = require('../Models/bookModel');
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
