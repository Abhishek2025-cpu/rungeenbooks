const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadProfileImage'); // updated path
const userController = require('../controllers/userController');

router.get('/get', userController.getAllUsers);
router.put('/update/:id', upload.single('profileImage'), userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);

module.exports = router;

