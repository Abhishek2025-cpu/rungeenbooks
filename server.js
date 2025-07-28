require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express(); // ✅ Define app early

// Routes
const categoryRoutes = require('./Routes/categoryRoutes');
const authRoutes = require('./Routes/authRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const bookRoutes = require('./Routes/books');
const orderRoutes = require('./Routes/order');
const userRoutes = require('./Routes/userRoutes'); // ✅ Make sure file path is correct
const reviewRoutes = require('./Routes/reviewRoutes'); // ✅ Ensure this is the correct path
const bookLikeRoutes = require('./Routes/bookLikeRoutes');
const authorInfoRoutes = require('./Routes/authorInfoRoutes'); // ✅ Ensure this is the correct path
const trendingBookRoutes = require('./Routes/trendingBookRoutes');

// Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use routes
app.use('/api/auth',authRoutes);
app.use('/api/user', userRoutes); // ✅ Ensure this is the correct path
app.use('/api/categories', categoryRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api', orderRoutes); // ✅ Now it’s in the right place
app.use('/api/reviews', reviewRoutes); // ✅ Ensure this is the correct path
app.use('/api/book-likes', bookLikeRoutes);
app.use('/api/author-info', authorInfoRoutes); // ✅ Ensure this is the correct path

app.use('/api/trending-books', trendingBookRoutes);



// 404 and error handlers
app.use((req, res, next) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message || 'Unexpected error' });
});

// MongoDB and Server Start
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
  });
}).catch(err => console.error('MongoDB connection error:', err));
