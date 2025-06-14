const express = require('express');
const router = express.Router();
const {
  postRatingAndReview,
  postReview,
  toggleLike,
  getBooksByCategory
} = require('../Controllars/bookActionsController');

// POST: Add rating (1–5)
router.post('/rate/:bookId', postRatingAndReview);

// POST: Add review
router.post('/review/:bookId', postReview);

// PATCH: Toggle like/unlike
router.patch('/like/:bookId', toggleLike);

// GET: Books by category with full nested data
router.get('/category/:categoryId', getBooksByCategory);

module.exports = router;
