// routes/books.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer'); // fields-based upload
const bookContr = require('../Controllars/booksController');

router.post('/add-book', upload, bookContr.addBook);
router.get('/get-books/category/:categoryId', bookContr.getBooksByCategory);
router.get('/single/:id', bookContr.getBookById);
router.put('/update/:id', upload.fields([{ name: 'pdf' }, { name: 'coverImage' }]), bookController.updateBook);
router.delete('/delete/:id', bookController.deleteBook);
router.patch('/toggle/:id', bookController.toggleBookStatus);


module.exports = router;

