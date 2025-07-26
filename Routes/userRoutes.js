const express = require('express');
const router = express.Router();
const uploadProfile = require('../middlewares/uploadProfile'); // ✅ use cloudinary uploader
const userController = require('../Controllars/userController'); // ✅ also fix "Controllars" to "Controllers"

router.get('/get', userController.getAllUsers);
router.put('/update/:id', uploadProfile.single('profileImage'), userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);
router.get('/single/:id', userController.getUserById);

module.exports = router;
