// controllers/paymentController.js

const crypto = require('crypto');
const Purchase = require('../Models/Purchase');
const Book = require('../Models/Book');

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, bookId } = req.body;

  const key_secret = 'pb0jXk8ovEuFQggCfvoey9Am';

  // Step 1: Validate signature
  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Step 2: Store purchase
  try {
    const existing = await Purchase.findOne({ userId, bookId });
    if (!existing) {
      await Purchase.create({ userId, bookId });
    }

    return res.status(200).json({ message: 'Payment verified & access granted' });
  } catch (err) {
    console.error('Purchase Save Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { verifyPayment };
