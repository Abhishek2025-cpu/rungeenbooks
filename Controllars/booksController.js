// controllers/bookController.js
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  try {
    const { name, about, category, price } = req.body;

    // Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    // Create new Book
    const newBook = new Book({
      name,
      about,
      category,
      price,
      pdfUrl: req.file.path, // ✅ store path of uploaded PDF
    });

    // Save to DB
    await newBook.save();

    // Respond with saved book
    return res.status(201).json({
      message: 'Book added successfully',
      book: newBook
    });

  } catch (err) {
    console.error('Add Book Error:', err);
    return res.status(500).json({
      error: 'Something went wrong',
      details: err.message
    });
  }
};

module.exports = { addBook };
