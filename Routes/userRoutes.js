const express = require('express');
const router = express.Router();

const uploadProfile = require('../middlewares/uploadProfile'); // cloudinary
const userController = require('../Controllars/userController'); // ✅ correct spelling

router.get('/get', userController.getAllUsers);
router.put('/update/:id', uploadProfile.single('profileImage'), userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);
router.get('/single/:id', userController.getUserById);

module.exports = router;
