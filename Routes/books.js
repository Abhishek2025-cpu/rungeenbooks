// routes/books.js
const express = require('express');
const router = express.Router();
const { addBook } = require('../Controllars/booksController');
const upload = require('../utilis/multerConfig');

router.post('/add-book', upload.single('pdf'), addBook);

module.exports = router;
