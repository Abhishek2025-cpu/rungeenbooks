require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const categoryRoutes = require('./Routes/categoryRoutes');
const authRoutes = require('./Routes/authRoutes');//updated
const bookRoutes = require('./Routes/bookRoutes');
const app = express();

app.use(express.json());
app.use(authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch(err => console.error(err));
