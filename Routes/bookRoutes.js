const express = require('express');
const router = express.Router();
const bookController = require('../Controllars/booksController');
const upload = require('../middlewares/multer'); // your updated multer config yes

// ✅ Add Book Route (with coverImage, otherImages, and pdf)
router.post(
  '/add-books',
  upload, // using multer.fields() internally
  bookController.addBook
);

// 📚 Get books by category
router.get('/get-books/category/:categoryId', bookController.getBooksByCategory);

// 📘 Get single book by ID
router.get('/get-book/:bookId', bookController.getBookById);

// 🛠 Update books by category
router.put('/books/update-by-category/:categoryId', bookController.updateBooksByCategory);

// ❌ Delete books by category
router.delete('/books/delete-by-category/:categoryId', bookController.deleteBooksByCategory);

module.exports = router;
