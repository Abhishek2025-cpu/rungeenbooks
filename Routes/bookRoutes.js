const express = require('express');
const router = express.Router();
const bookController = require('../Controllars/bookController');
const upload = require('../middlewares/multer');

// Add Book Route
router.post(
  '/add-books',
  (req, res, next) => {
    console.log('🔥 Route /api/books/add-books HIT');
    next();
  },
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'pdf', maxCount: 1 },
  ]),
  bookController.addBook
);

// Get books by category (PDF URL only if subscribed)
router.get('/get-books/category/:categoryId', bookController.getBooksByCategory);

// Get single book by ID (PDF URL only if subscribed)
router.get('/get-book/:bookId', bookController.getBookById);

// Serve PDF by book ID (streamed from MongoDB)
router.get('/pdf/:bookId', bookController.getPdfByBookId);

// Toggle like
router.patch('/like-book/:bookId/toggle-like', bookController.toggleLike);

module.exports = router;
