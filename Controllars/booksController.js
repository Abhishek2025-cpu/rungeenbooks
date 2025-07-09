


const path = require('path');
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  console.log("FILES:", req.files);
console.log("BODY:", req.body);

  try {
    const { name, about, category, price } = req.body;

    const pdfFile = req.files?.pdf?.[0];
    const coverImage = req.files?.coverImage?.[0];
    const otherImages = req.files?.otherImages || [];

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
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
        pdf: newBook.pdfUrl,
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


