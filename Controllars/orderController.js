const Razorpay = require("razorpay");
const Order = require("../Models/Order");
const Book = require("../Models/Book");
const User = require("../Models/User");

// ✅ Initialize Razorpay with Key & Secret
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_peX01P5vxyNOOw",       // <-- Your keyId
  key_secret: "pb0jXk8ovEuFQggCfvoey9Am", // <-- Your secret
});

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book || !user) {
      return res.status(404).json({ message: "Book or User not found" });
    }

    const amountInPaise = book.price * 100;

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    const newOrder = new Order({
      user: userId,
      book: bookId,
      orderId: razorpayOrder.id,
      amount: book.price,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      keyId: "rzp_test_peX01P5vxyNOOw", // 👈 send this so frontend can match
      razorpayOrderId: razorpayOrder.id,
      amount: book.price,
      currency: "INR",
      order: newOrder,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// Verify payment and update status
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, status } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentId = paymentId;
    order.status = status || 'paid';
    await order.save();

    res.status(200).json({ success: true, message: 'Payment verified', order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Fetch all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only return orders where payment is successful
    const orders = await Order.find({ user: userId, status: 'paid' })
      .populate({
        path: 'book',
        select: 'name coverImage pdfUrl', // Include pdfUrl only after payment
      })
      .populate('user', 'firstname lastname email')
      .lean();

    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



// ADMIN: Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'firstname lastname email')
      .populate('book', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ADMIN: Get specific order detail
exports.getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'firstname lastname email')
      .populate('book', 'name price pdfUrl')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

