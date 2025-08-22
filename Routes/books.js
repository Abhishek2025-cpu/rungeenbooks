// routes/books.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer'); // fields-based upload
const bookContr = require('../Controllars/booksController');

router.post('/add-book', upload, bookContr.addBook);
router.get('/get-books/category/:categoryId', bookContr.getBooksByCategory);
router.get('/single/:id', bookContr.getBookById);
router.put('/update/:id', upload, bookContr.updateBook);
router.delete('/delete/:id', bookContr.deleteBook);
router.patch('/toggle/:id', bookContr.toggleBookStatus);
router.get('/latest', bookContr.getLatestBooks);
router.get('/search', bookContr.searchBooks);
router.get('/filter', bookContr.filterBooks);


module.exports = router;

