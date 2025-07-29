const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders
} = require('../controllers/orderController');

router.post('/create', createOrder);
router.post('/verify', verifyPayment);
router.get('/user/:userId', getUserOrders);

module.exports = router;
