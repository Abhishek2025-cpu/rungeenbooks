const express = require('express');
const router = express.Router();
const bookController = require('../Controllars/booksController');
const upload = require('../middlewares/Multerconfig');

// Add a book to a category
router.post('/add-book/:categoryId', upload.array('images', 5), bookController.addBook);

// Get all books by category
router.get('/get-books/:categoryId', bookController.getBooksByCategory);

module.exports = router;
