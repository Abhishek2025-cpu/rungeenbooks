// At the VERY TOP of your main server file (e.g., app.js or index.js),
// you MUST have this line:
// require('dotenv').config();

const Razorpay = require("razorpay");
const Order = require("../Models/Order");
const Book = require("../Models/Book");
const User = require("../Models/User");

// ================== DIAGNOSTIC CHECK ==================
// Add these lines to check if your .env file is being loaded.
console.log("-----------------------------------------");
console.log("LOADING RAZORPAY CREDENTIALS...");
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("🔥 FATAL ERROR: Razorpay Key ID or Key Secret is not defined.");
  console.error("🔥 Please check your .env file and ensure it is loaded correctly.");
  // Optional: exit the process if keys are missing in production
  // process.exit(1); 
} else {
  console.log("✅ Razorpay Key ID loaded successfully.");
}
console.log("-----------------------------------------");
// ======================================================


// Initialize Razorpay with keys from environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
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
      return res.status(400).json({ success: false, message: "Invalid book price. It must be a positive number." });
    }

    const amountInPaise = Math.round(book.price * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: "Razorpay order creation failed." });
    }

    const newOrder = new Order({
      user: userId,
      book: bookId,
      razorpayOrderId: razorpayOrder.id,
      amount: book.price,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      order: newOrder,
    });

  } catch (err) {
    // ============= NEW, MORE ROBUST CATCH BLOCK =============
    console.error("🔥 FULL ERROR OBJECT:", err); // This will show the whole error in your console

    let errorMessage = "An unknown error occurred.";
    if (err.message) {
      errorMessage = err.message;
    } else if (err.error && err.error.description) {
      // This handles specific Razorpay API error structures
      errorMessage = err.error.description;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + errorMessage,
    });
    // ==========================================================
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

