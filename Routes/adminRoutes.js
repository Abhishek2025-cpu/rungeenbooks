const express = require('express');
const router = express.Router();
const adminController = require('../Controllars/adminController');

// Register
router.post('/register', adminController.registerAdmin);

// Login
router.post('/login', adminController.loginAdmin);

// Update
router.put('/update/:id', adminController.updateAdmin);

// Delete
router.delete('/delete/:id', adminController.deleteAdmin);

module.exports = router;
