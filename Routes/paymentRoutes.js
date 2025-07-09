// routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../Controllars/paymentController');

router.post('/verify', verifyPayment);

module.exports = router;
