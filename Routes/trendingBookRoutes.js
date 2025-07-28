// routes/trendingBookRoutes.js
const express = require('express');
const router = express.Router();
const trendingController = require('../Controllars/trendingBookController');

// Add a book to trending
router.post('/add', trendingController.addTrendingBook);

// Update position
router.put('/update/:id', trendingController.updateTrendingBook);

// Remove from trending
router.delete('/remove/:id', trendingController.removeTrendingBook);

// Get all trending books
router.get('/all', trendingController.getTrendingBooks);

module.exports = router;
