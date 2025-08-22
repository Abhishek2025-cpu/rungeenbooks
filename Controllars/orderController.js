
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
  key_id: "rzp_test_WFobdSiykj0jlI", // <-- Replace with your real, secret key
  key_secret: "4mAexiEcJUH7DIcG4utkVJYS", // <-- Replace with your real, secret secret
});

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
    // Accept both frontend (paymentId, orderId, orderSignature) 
    // and Razorpay standard names (razorpay_payment_id, etc.)
    const razorpay_order_id = req.body.orderId || req.body.razorpay_order_id;
    const razorpay_payment_id = req.body.paymentId || req.body.razorpay_payment_id;
    const razorpay_signature = req.body.orderSignature || req.body.razorpay_signature;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment details are required." });
    }

    // ✅ Generate expected signature using the same secret as razorpayInstance
    const signString = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(signString)
      .digest("hex");

    console.log("📝 signString:", signString);
    console.log("📝 expectedSign:", expectedSign);
    console.log("📝 providedSignature:", razorpay_signature);

    if (expectedSign === razorpay_signature) {
      const order = await Order.findOne({ orderId: razorpay_order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      order.paymentId = razorpay_payment_id;
      order.status = "paid";
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        orderId: razorpay_order_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }
  } catch (err) {
    console.error("🔥 verifyPayment Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + err.message,
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

