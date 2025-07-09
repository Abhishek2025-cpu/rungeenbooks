require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ Add this
const path = require('path');
const fs = require('fs');

const categoryRoutes = require('./Routes/categoryRoutes');
const authRoutes = require('./Routes/authRoutes');

const bookRoute = require('./Routes/books');

const app = express();

// ✅ Allow CORS for localhost ports 5173 and 5174
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const uploadsAbsolutePath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsAbsolutePath));

app.use(express.json());
app.use(authRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/api/books', bookRoute);
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
