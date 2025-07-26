const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadProfile'); // ✅ this stays
const userController = require('../Controllars/userController'); // also fix spelling if needed

router.get('/get', userController.getAllUsers);
router.put('/update/:id', upload.single('profileImage'), userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);
router.get('/single/:id', userController.getUserById);

module.exports = router;
