// routes/bookLikeRoutes.js

const express = require('express');
const router = express.Router();
const bookLikeController = require('../Controllars/bookLikeController');

router.post('/post-like', bookLikeController.likeBook);
router.delete('/remove/:bookId/:userId', bookLikeController.unlikeBook);
router.get('/all/book/:bookId', bookLikeController.getLikesByBook);
router.get('/all/category/:categoryId', bookLikeController.getLikesByCategory);

module.exports = router;
