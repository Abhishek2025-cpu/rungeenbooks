const express = require('express');
const router = express.Router();
const uploadProfile = require('../middlewares/uploadProfile');
const {
  addAuthor,
  getAuthors,
  updateAuthor
} = require('../Controllars/authorInfoController');

router.post('/add', uploadProfile.single('profile'), addAuthor);
router.get('/get', getAuthors);
router.patch('/update/:id', uploadProfile.single('profile'), updateAuthor);
module.exports = router;
