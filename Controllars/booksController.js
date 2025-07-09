// controllers/bookController.js
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  try {
    const { name, about, category, price } = req.body;

    // Access PDF file correctly when using upload.fields
    const pdfFile = req.files?.pdf?.[0];
    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const newBook = new Book({
      name,
      about,
      category,
      price,
      pdfUrl: pdfFile.path, // ✅ Store uploaded path
    });

    await newBook.save();

   return res.status(201).json({
  message: 'Book added successfully',
  book: {
    ...newBook.toObject(),
    pdf: newBook.pdfUrl, // ✅ override for response
  }
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
