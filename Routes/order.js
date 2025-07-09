
const Razorpay = require('razorpay');
const express = require('express');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: 'rzp_live_tpZpCYre4JMy2b',
  key_secret: 'pb0jXk8ovEuFQggCfvoey9Am'
});

router.post('/api/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  try {
    const options = {
      amount: amount * 100, // in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: 'Unable to create order' });
  }
});

module.exports = router;