// routes/books.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer'); // fields-based upload
const { addBook } = require('../controllers/bookController');

router.post('/add-book', upload, addBook);

module.exports = router;

