// At the top of your main server file (e.g., index.js or app.js)
require("dotenv").config(); // Make sure to run: npm install dotenv

const Razorpay = require("razorpay");
const Order = require("../Models/Order");
const Book = require("../Models/Book");
const User = require("../Models/User");

// ✅ Initialize Razorpay with keys from environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    // Basic validation for incoming data
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

    // ✅ Crucial Validation: Ensure price is a valid number
    if (typeof book.price !== 'number' || book.price <= 0) {
        return res.status(400).json({ success: false, message: "Invalid book price. It must be a positive number." });
    }

    const amountInPaise = Math.round(book.price * 100); // Use Math.round to avoid floating point issues

    const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_order_${new Date().getTime()}`, // More unique receipt
    };

    // Create the order on Razorpay's servers
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // If Razorpay order creation fails, it will throw an error and be caught below
    if (!razorpayOrder) {
        return res.status(500).json({ success: false, message: "Razorpay order creation failed." });
    }

    // Save the order details to your own database
    const newOrder = new Order({
      user: userId,
      book: bookId,
      razorpayOrderId: razorpayOrder.id, // Storing razorpay's order ID
      amount: book.price,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status, // Store initial status (e.g., 'created')
    });

    await newOrder.save();

    // Send back the necessary details to the frontend
    res.status(200).json({
      success: true,
      message: "Order created successfully",
      keyId: process.env.RAZORPAY_KEY_ID, // Send the public key to the client
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise, // It's conventional to send amount in paise to frontend handler
      currency: "INR",
      order: newOrder, // Your internal order object
    });

  } catch (err) {
    console.error("🔥 Razorpay createOrder error:", err);
    // Send a more specific error message
    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + err.message,
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

