const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadProfile');
const userController = require('../Controllars/userController');

router.get('/get', userController.getAllUsers);
router.put('/update/:id', upload.single('profileImage'), userController.updateUser); // ✅ this line must have valid functions
router.delete('/delete/:id', userController.deleteUser);
router.get('/single/:id', userController.getUserById);

module.exports = router;

