// routes/books.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer'); // fields-based upload
const bookContr = require('../Controllars/booksController');

router.post('/add-book', upload, bookContr.addBook);
router.get('/get-books/category/:categoryId', bookContr.getBooksByCategory);
router.get('/single/:id', bookContr.getBookById);

module.exports = router;

