
const mongoose = require('mongoose');
const Razorpay = require("razorpay");
const Order = require("../Models/Order");
const Book = require("../Models/Book");
const User = require("../Models/User");
const axios = require('axios'); 
const currencies = {
  'INR': '₹',
  'USD': '$',
  'AUD': 'AU$',
  'EUR': '€',
  'AED': 'AED',
  'JPY': '¥',
  'GBP': '£',
  'RUB': 'руб.',
  'ZAR': 'R',
  'MYR': 'RM',
  'PKR': '₨',
  'SAR': '﷼',
  'SGD': 'S$',
  'THB': '฿',
  'VND': '₫',
  'TRY': '₺',
  'PHP': '₱',
  'NZD': '$',
  'NPR': '₨',
  'BDT': '৳',
  'PLN': 'zł',
};
// Use your new, secret keys here. I'm using placeholders.
const razorpayInstance = new Razorpay({
  key_id: " rzp_live_tpZpCYre4JMy2b", // <-- Replace with your real, secret key
  key_secret: " pb0jXk8ovEuFQggCfvoey9Am", // <-- Replace with your real, secret secret
});

//  rzp_live_tpZpCYre4JMy2b
//  pb0jXk8ovEuFQggCfvoey9Am

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { bookId, userId, currency_code } = req.body;

    if (!bookId || !userId || !currency_code) {
      return res.status(400).json({
        success: false,
        message: "bookId, userId and currency_code are required."
      });
    }

    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (typeof book.price !== "number" || book.price <= 0) {
      return res.status(400).json({ success: false, message: "Invalid book price." });
    }

    // ✅ Validate currency
    if (!currencies[currency_code]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported currency code: ${currency_code}`
      });
    }

    // ✅ Convert INR price → selected currency using Frankfurter (no API key required)
    let convertedPrice = book.price;
    if (currency_code !== "INR") {
      try {
        const fx = await axios.get("https://api.frankfurter.app/latest", {
          params: { amount: book.price, from: "INR", to: currency_code }
        });

        if (fx.data && fx.data.rates && fx.data.rates[currency_code]) {
          convertedPrice = fx.data.rates[currency_code];
        } else {
          throw new Error("Invalid conversion response");
        }
      } catch (error) {
        console.error("⚠️ Currency API Error:", error.message);
        return res.status(502).json({
          success: false,
          message: "Currency conversion failed. Please try again later."
        });
      }
    }

    const amountInSubunits = Math.round(convertedPrice * 100);

    const options = {
      amount: amountInSubunits,
      currency: currency_code,
      receipt: `receipt_order_${Date.now()}`
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // ✅ Save order in DB
    const newOrder = new Order({
      user: userId,
      book: bookId,
      orderId: razorpayOrder.id,
      amount: convertedPrice, // converted price in chosen currency
      currency: currency_code,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      razorpayOrderId: razorpayOrder.id,
      amount: amountInSubunits,
      currency: currency_code,
      currency_symbol: currencies[currency_code],
      convertedPrice,
      order: newOrder,
    });

  } catch (err) {
    console.error("🔥 createOrder Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + (err.message || "Unknown error"),
    });
  }
};




// Verify payment and update status
const crypto = require("crypto");


// same secret you used in razorpayInstance
const RAZORPAY_KEY_SECRET = "4mAexiEcJUH7DIcG4utkVJYS"; // <-- your real secret

exports.verifyPayment = async (req, res) => {
  try {
    const {
      orderId: clientOrderId,
      paymentId: clientPaymentId,
      orderSignature: clientSignature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // normalize fields
    const orderId = razorpay_order_id || clientOrderId;
    const paymentId = razorpay_payment_id || clientPaymentId;
    const signature = razorpay_signature || clientSignature;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: "Payment details are required." });
    }

    const signString = `${orderId}|${paymentId}`;
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(signString)
      .digest("hex");

    if (expectedSign !== signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    // ✅ Update in one step
    const order = await Order.findOneAndUpdate(
      { orderId },
      { paymentId, status: "paid" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found in DB." });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order updated.",
      order
    });

  } catch (err) {
    console.error("🔥 verifyPayment Error:", err);
    res.status(500).json({ success: false, message: err.message });
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
        select: 'name coverImage pdfUrl authorId', // include authorId so we can populate
        populate: {
          path: 'authorId',
          model: 'AuthorInfo',
          select: 'name profile', // you can also add "info" if needed
        },
      })
      .populate('user', 'firstname lastname email')
      .lean();

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("🔥 getUserOrders Error:", err);
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

// ADMIN: Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error("🔥 deleteOrder Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
