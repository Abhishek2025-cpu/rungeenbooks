const express = require('express');
const router = express.Router();
const { addBook, getBooksByCategory } = require('../Controllars/booksController');
const upload = require('../middlewares/Multerconfig'); // your multer setup done

router.post('/add-book', upload.array('images'), addBook);
router.get('/category/:categoryId', getBooksByCategory);

module.exports = router;
