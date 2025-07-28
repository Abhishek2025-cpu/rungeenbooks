// routes/bookLikeRoutes.js

const express = require('express');
const router = express.Router();
const bookLikeController = require('../Controllars/bookLikeController');

router.patch('/like', bookLikeController.toggleLikeBook);
router.get('/all/book/:bookId', bookLikeController.getLikesByBook);
router.get('/all/category/:categoryId', bookLikeController.getLikesByCategory);

module.exports = router;
