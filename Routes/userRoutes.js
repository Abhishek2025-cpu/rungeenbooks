const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadProfile'); // updated path
const userController = require('../controllers/userController');

router.get('/get', userController.getAllUsers);
router.put('/update/:id', upload.single('profileImage'), userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);
router.get('/single/:id', userController.getUserById);
module.exports = router;

