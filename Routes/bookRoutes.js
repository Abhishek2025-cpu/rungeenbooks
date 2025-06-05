const express = require('express');
const router = express.Router();
const bookController = require('../Controllars/bookController');
const multer = require('multer');


// Setup multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route: Add a new book
router.post(
  '/add-books',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'pdf', maxCount: 1 }
  ]),
  bookController.addBook
);
router.get('/get-books/category/:categoryId', bookController.getBooksByCategory);
router.get('/get-book/:bookId', bookController.getBookById);
router.patch('/like-book/:bookId/toggle-like', bookController.toggleLike);

module.exports = router;
