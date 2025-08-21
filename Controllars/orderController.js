const mongoose = require('mongoose');
const Razorpay = require("razorpay");
const Order = require("../Models/Order");
const Book = require("../Models/Book");
const User = require("../Models/User");

// ✅ Initialize Razorpay with keys hardcoded directly for testing.
// This block is now correctly included.
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_R3vTwa7lyp8uO1",
  key_secret: "en9uUmqUZb0kqokSFtt6Zb1y",
});

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
  // STEP 1: Log that the function has started
  console.log("\n--- [createOrder] Function Started ---");

  try {
    const { bookId, userId } = req.body;

    // STEP 2: Log the incoming data from the client
    console.log(`[Step 2] Received bookId: ${bookId}, userId: ${userId}`);

    // VALIDATION: Check if IDs are valid MongoDB ObjectIds before querying
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.error("[ERROR] Invalid bookId format.");
      return res.status(400).json({ success: false, message: `Invalid bookId format: ${bookId}` });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("[ERROR] Invalid userId format.");
      return res.status(400).json({ success: false, message: `Invalid userId format: ${userId}` });
    }
    console.log(`[Step 2.5] IDs are in valid format.`);


    // STEP 3: Find the book
    console.log(`[Step 3] Querying database for book with ID: ${bookId}`);
    const book = await Book.findById(bookId);

    if (!book) {
      console.error("[ERROR] Book not found in database.");
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    console.log(`[Step 4] Book found successfully. Price: ${book.price}`);


    // STEP 5: Find the user
    console.log(`[Step 5] Querying database for user with ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      console.error("[ERROR] User not found in database.");
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.log(`[Step 6] User found successfully.`);


    // STEP 7: Validate the price
    if (typeof book.price !== 'number' || book.price <= 0) {
      console.error(`[ERROR] Invalid book price. Value is: ${book.price}, Type is: ${typeof book.price}`);
      return res.status(400).json({ success: false, message: "Invalid book price. It must be a positive number." });
    }
    console.log(`[Step 7] Book price is valid.`);


    const amountInPaise = Math.round(book.price * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };
    console.log(`[Step 8] Prepared Razorpay options:`, options);


    // STEP 9: Call Razorpay API
    console.log(`[Step 9] Sending request to Razorpay...`);
    const razorpayOrder = await razorpayInstance.orders.create(options);
    console.log(`[Step 10] Razorpay order created successfully. Order ID: ${razorpayOrder.id}`);


    // STEP 11: Save to your database
    const newOrder = new Order({
      user: userId,
      book: bookId,
      razorpayOrderId: razorpayOrder.id,
      amount: book.price,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
    });
    console.log(`[Step 11] Saving new order to local database...`);
    await newOrder.save();
    console.log(`[Step 12] Order saved to local database successfully.`);


    res.status(200).json({
      success: true,
      message: "Order created successfully",
      keyId: "rzp_test_R3vTwa7lyp8uO1", 
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      order: newOrder,
    });

  } catch (err) {
    console.error("--- [FATAL ERROR IN CATCH BLOCK] ---");
    console.error("🔥 FULL ERROR OBJECT:", err); 

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

