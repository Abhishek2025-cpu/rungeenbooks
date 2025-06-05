const express = require('express');
const router = express.Router();
const bookController = require('../Controllers/bookController');
const multer = require('multer');
const storage = multer.memoryStorage();

const upload = multer({ storage }).fields([
  { name: 'images', maxCount: 5 },
  { name: 'pdf', maxCount: 1 }
]);


// Routes
router.post('/add-books', upload.array('images'), bookController.addBook);
router.get('/get-books/category/:categoryId', bookController.getBooksByCategory);
router.get('/get-book/:bookId', bookController.getBookById);
router.patch('/like-book/:bookId/toggle-like', bookController.toggleLike);

module.exports = router;
