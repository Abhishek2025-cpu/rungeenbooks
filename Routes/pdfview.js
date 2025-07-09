// GET /books/:id/pdf?userId=xxxx

const Book = require('../Models/Book');
const Purchase = require('../Models/Purchase'); // Your purchase records
const path = require('path');
const fs = require('fs');

const getBookPdf = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.query.userId;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const purchase = await Purchase.findOne({ userId, bookId });
    if (!purchase) {
      return res.status(403).json({ error: 'Access denied. Please purchase the book.' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', book.pdfFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('Get Book PDF Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports ={getBookPdf}