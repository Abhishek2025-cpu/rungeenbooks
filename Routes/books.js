// routes/books.js
const express = require('express');
const router = express.Router();
const { addBook } = require('../Controllars/booksController');
const upload = require('../middlewares/multer');
router.post('/add-book', upload, addBook);


module.exports = router;
