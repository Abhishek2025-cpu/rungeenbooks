const express = require('express');
const router = express.Router();
const {
  postRatingAndReview,
  postReview,
  toggleLike,
  getRatingsAndReviews,
  getBooksByCategory,
  getFavoriteBooks
} = require('../Controllars/bookActionsController');

// POST: Add rating (1–5)
router.post('/rate/:bookId', postRatingAndReview);

// POST: Add review
router.post('/review/:bookId', postReview);

// PATCH: Toggle like/unlike
router.post('/like/:bookId',toggleLike);
router.get('/users/:userId/favorites',getFavoriteBooks);
// GET: Ratings and reviews for a book
router.get('/review-rating/:bookId', getRatingsAndReviews);

// GET: Books by category with full nested data
router.get('/category/:categoryId', getBooksByCategory);

module.exports = router;
