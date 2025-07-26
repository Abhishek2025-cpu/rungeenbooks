const express = require('express');
const router = express.Router();
const reviewController = require('../Controllars/reviewController');

// POST /api/reviews
router.post('/add', reviewController.addReview);

// GET all reviews
router.get('/get-all', reviewController.getAllReviews);

// GET single review by ID
router.get('/single/:id', reviewController.getReview);

// UPDATE review
router.put('/update/:id', reviewController.updateReview);

// DELETE review
router.delete('/delete/:id', reviewController.deleteReview);
// GET all reviews for a specific book
router.get('/book/:bookId', reviewController.getReviewsByBookId);
module.exports = router;