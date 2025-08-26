const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
    getAllOrders,
  getSingleOrder,
  deleteOrder,
} = require('../Controllars/orderController');

router.post('/create', createOrder);
router.post('/verify', verifyPayment);
router.get('/user/:userId', getUserOrders);
// Admin: Get all orders
router.get('/admin/all', getAllOrders);
router.delete('/admin/delete/:orderId',deleteOrder); 

// Admin: Get single order details
router.get('/single/:orderId', getSingleOrder);

module.exports = router;
