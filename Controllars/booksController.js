// controllers/bookController.js
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  try {
    const { name, about, category_id, price } = req.body;

    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

    const newBook = new Book({
      name,
      about,
      category_id,
      price,
      pdfUrl: req.file.path,
      subscribeId: null,
      userId: null
    });

    await newBook.save();
    res.status(201).json({ message: 'Book added successfully', book: newBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { addBook };
