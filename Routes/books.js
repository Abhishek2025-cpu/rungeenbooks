// routes/books.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer'); // fields-based upload
const { addBook,getBooksByCategory } = require('../Controllars/booksController');

router.post('/add-book', upload, addBook);
router.get('/category/:categoryId', getBooksByCategory);

module.exports = router;

