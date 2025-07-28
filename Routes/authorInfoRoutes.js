const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadProfile');
const {
  addAuthor,
  getAuthors,
  updateAuthor
} = require('../Controllars/authorInfoController');

router.post('/add', upload.single('profile'), addAuthor);
router.get('/get', getAuthors);
router.patch('/update/:id', upload.single('profile'), updateAuthor);

module.exports = router;
