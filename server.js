require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ Add this
const path = require('path');

const categoryRoutes = require('./Routes/categoryRoutes');
const authRoutes = require('./Routes/authRoutes');
const bookRoutes = require('./Routes/bookRoutes');
const bookAction = require("./Routes/bookActions");

const app = express();

// ✅ Allow CORS for localhost ports 5173 and 5174
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

app.use(authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/book', bookAction);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err.stack || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Unexpected error',
  });
});

// MongoDB Connection and Server Start
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}).catch(err => console.error(err));
