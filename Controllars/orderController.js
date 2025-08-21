
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment details are required." });
    }
    
    // ✅ Using the official Razorpay utility for verification
    const isAuthentic = Razorpay.utils.verifyPaymentSignature({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
    }, razorpay_signature, process.env.RAZORPAY_KEY_SECRET); // It uses the same secret key

    if (isAuthentic) {
      // Payment is authentic. Update your database.
      const order = await Order.findOne({ orderId: razorpay_order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      order.paymentId = razorpay_payment_id;
      order.status = 'paid';
      order.signature = razorpay_signature;

      await order.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully.',
        orderId: razorpay_order_id,
      });

    } else {
      // Payment verification failed
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

  } catch (err) {
    console.error("🔥 verifyPayment Error:", err);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error: " + err.message 
    });
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

