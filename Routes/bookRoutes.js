const express = require('express');
const router = express.Router();
const bookController = require('../Controllars/bookController');
const upload = require('../middlewares/multer');

// 🔥 Add Book Route (images only)
router.post(
  '/add-books',
  upload.fields([
    { name: 'images', maxCount: 10 }
  ]),
  bookController.addBook
);

// 📚 Get books by category
router.get('/get-books/category/:categoryId', bookController.getBooksByCategory);

// 📘 Get single book by ID
router.get('/get-book/:bookId', bookController.getBookById);

module.exports = router;
