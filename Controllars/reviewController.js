const Review = require('../Models/Review');
const User = require('../Models/User');
const Book = require('../Models/Book');

// Add Review
exports.addReview = async (req, res) => {
  try {
    const { userId, bookId, rating, description } = req.body;

    if (!userId || !bookId || !rating) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const review = new Review({ user: userId, book: bookId, rating, description });
    await review.save();

    res.json({ success: true, message: "Review added", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'firstname lastname profileImage')
      .populate('book', 'title');

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single review
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'firstname lastname profileImage')
      .populate('book', 'title');

    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { rating, description, userId } = req.body; // Get user ID from body

    const updated = await Review.findOneAndUpdate(
      { _id: req.params.id, user: userId }, // Match by review ID and user ID
      { rating, description },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found or user not authorized" });
    }

    res.json({ success: true, message: "Review updated", review: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// UPDATE user profile (with profileImage)



// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Review not found" });

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get all reviews for a specific book with review count
exports.getReviewsByBookId = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ book: bookId })
      .populate('user', 'firstname lastname profileImage')
      .populate('book', 'title');

    const reviewCount = reviews.length;

    res.json({
      success: true,
      reviewCount,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};