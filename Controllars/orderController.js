const mongoose = require('mongoose');
const Razorpay = require("razorpay");
const Order = require("../Models/Order");
const Book = require("../Models/Book");
const User = require("../Models/User");

// Use your new, secret keys here. I'm using placeholders.
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_WFobdSiykj0jlI", // <-- Replace with your real, secret key
  key_secret: "4mAexiEcJUH7DIcG4utkVJYS", // <-- Replace with your real, secret secret
});

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    if (!bookId || !userId) {
      return res.status(400).json({ success: false, message: "bookId and userId are required." });
    }

    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (typeof book.price !== 'number' || book.price <= 0) {
      return res.status(400).json({ success: false, message: "Invalid book price." });
    }

    const amountInPaise = Math.round(book.price * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    // This part is now working!
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Create the order object to save in your DB
    const newOrder = new Order({
      user: userId,
      book: bookId,
      orderId: razorpayOrder.id, // ✅ CORRECTED LINE
      amount: book.price,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
    });

    await newOrder.save();

    // Success!
    res.status(200).json({
      success: true,
      message: "Order created successfully",
      keyId: "rzp_test_WFobdSiykj0jlI", // <-- Send the public key to the client
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      order: newOrder,
    });

  } catch (err) {
    console.error("🔥 createOrder Error:", err); 

    let errorMessage = "An unknown error occurred.";
    if (err.error && err.error.description) {
      errorMessage = err.error.description;
    } else if (err.message) {
      errorMessage = err.message;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + errorMessage,
    });
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

