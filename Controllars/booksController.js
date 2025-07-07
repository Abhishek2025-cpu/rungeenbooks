// controllers/bookController.js
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  try {
     console.log('req.body:', req.body);
    const { name, about, category, price } = req.body;

    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

    const newBook = new Book({
      name,
      about,
      category,
      price,
      pdfUrl: req.file.path,
      subscribeId: null,
      userId: null
    });

    await newBook.save();
    res.status(201).json({ message: 'Book added successfully', book: newBook });
  }  catch (error) {
  console.error('Error:', error); // Log the actual error
  res.status(500).json({ error: 'Something went wrong', details: error.message });
}
};

module.exports = { addBook };
