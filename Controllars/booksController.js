// controllers/bookController.js
const Book = require('../Models/Book');


const path = require('path');

const addBook = async (req, res) => {
  try {
    const { name, about, category, price } = req.body;

    const pdfFile = req.files?.pdf?.[0];
    const coverImage = req.files?.coverImage?.[0];
    const otherImages = req.files?.otherImages || [];

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    if (!name || !about || !category || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newBook = new Book({
      name,
      about,
      category,
      price,
      pdfUrl: `/uploads/${pdfFile.filename}`,
      coverImage: coverImage ? `/uploads/${coverImage.filename}` : undefined,
      images: {
        otherImages: otherImages.map(img => `/uploads/${img.filename}`)
      }
    });

    await newBook.save();

    return res.status(201).json({
      message: 'Book added successfully',
      book: {
        ...newBook.toObject(),
        pdf: newBook.pdfUrl // for frontend compatibility
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
